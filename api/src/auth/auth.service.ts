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
  email: string;
  password_hash: string;
  display_name: string | null;
  role: 'owner' | 'member';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  role: 'owner' | 'member';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * On startup, make sure the owner account from env exists so login keeps
   * working after switching from env-based auth to the users table.
   */
  async onModuleInit(): Promise<void> {
    const email = process.env.OWNER_EMAIL;
    const password = process.env.OWNER_PASSWORD;
    if (!email || !password) {
      this.logger.warn('OWNER_EMAIL/OWNER_PASSWORD not set; skipping owner seed.');
      return;
    }

    try {
      await this.seedOwner(normalizeEmail(email), password, 'เจ้าของฟาร์ม');
    } catch (error) {
      // Don't crash the app if the DB isn't reachable yet; just log it.
      this.logger.warn(
        `Could not seed owner user: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async findByEmail(email: string): Promise<UserRow | null> {
    const { data, error } = await this.supabase.client
      .from('users')
      .select('id, email, password_hash, display_name, role')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Could not load user: ${error.message}`);
    }
    return (data as UserRow) ?? null;
  }

  /** Create the owner account if it doesn't exist yet. Idempotent. */
  async seedOwner(email: string, password: string, displayName: string): Promise<void> {
    const existing = await this.findByEmail(email);
    if (existing) return;

    const passwordHash = await hashPassword(password);
    const { error } = await this.supabase.client.from('users').insert({
      email,
      password_hash: passwordHash,
      display_name: displayName,
      role: 'owner',
    });

    if (error) {
      // A unique-violation here means another startup created it first — fine.
      if (error.code === '23505') return;
      throw new InternalServerErrorException(`Could not seed owner: ${error.message}`);
    }
    this.logger.log(`Seeded owner user: ${email}`);
  }

  async validateCredentials(input: LoginDto): Promise<AuthenticatedUser> {
    const email = normalizeEmail(input.email);
    const user = await this.findByEmail(email);

    // Run a hash even when the user is missing to keep timing roughly constant.
    const isValid = user
      ? await verifyPassword(input.password, user.password_hash)
      : await verifyPassword(input.password, 'scrypt$00$00').then(() => false);

    if (!user || !isValid) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    };
  }
}
