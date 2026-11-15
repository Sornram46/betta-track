import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  // Format isn't validated here on purpose: an invalid username simply won't match
  // any row and returns the same 401 as a wrong password.
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;
}
