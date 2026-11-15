import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from './password';

interface UserRow {
  id: string;
  username: string;
  email: string | null;
  password_hash: string;
  display_name: string | null;
  role: 'owner' | 'member';
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  role: 'owner' | 'member';
}

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * On startup, create the owner account from OWNER_USERNAME/OWNER_PASSWORD if it
   * doesn't exist yet. Optional: skipped when the env vars are not set.
   */
  async onModuleInit(): Promise<void> {
    const username = process.env.OWNER_USERNAME;
    const password = process.env.OWNER_PASSWORD;
    if (!username || !password) {
      this.logger.warn('OWNER_USERNAME/OWNER_PASSWORD not set; skipping owner seed.');
      return;
    }

    const normalized = normalizeUsername(username);
    if (!USERNAME_PATTERN.test(normalized)) {
      this.logger.warn('OWNER_USERNAME must be 3-30 chars of a-z, 0-9, ".", "_" or "-"; skipping owner seed.');
      return;
    }

    try {
      await this.seedOwner(normalized, password, 'เจ้าของฟาร์ม');
    } catch (error) {
      // Don't crash the app if the DB isn't reachable yet; just log it.
      this.logger.warn(
        `Could not seed owner user: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async findByUsername(username: string): Promise<UserRow | null> {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('id, username, email, password_hash, display_name, role')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Could not load user: ${error.message}`);
    }
    return (data as UserRow) ?? null;
  }

  /** Create the owner account if it doesn't exist yet. Idempotent. */
  async seedOwner(username: string, password: string, displayName: string): Promise<void> {
    const existing = await this.findByUsername(username);
    if (existing) return;

    const passwordHash = await hashPassword(password);
    const { error } = await this.supabase.client.from('users').insert({
      username,
      password_hash: passwordHash,
      display_name: displayName,
      role: 'owner',
    });

    if (error) {
      // A unique-violation here means another startup created it first — fine.
      if (error.code === '23505') return;
      throw new InternalServerErrorException(`Could not seed owner: ${error.message}`);
    }
    this.logger.log(`Seeded owner user: ${username}`);
  }

  async validateCredentials(input: LoginDto): Promise<AuthenticatedUser> {
    const username = normalizeUsername(input.username);
    // Skip the DB lookup for usernames that can't exist.
    const user = USERNAME_PATTERN.test(username) ? await this.findByUsername(username) : null;

    // Run a hash even when the user is missing to keep timing roughly constant.
    const isValid = user
      ? await verifyPassword(input.password, user.password_hash)
      : await verifyPassword(input.password, 'scrypt$00$00').then(() => false);

    if (!user || !isValid) {
      throw new UnauthorizedException('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    };
  }
}
