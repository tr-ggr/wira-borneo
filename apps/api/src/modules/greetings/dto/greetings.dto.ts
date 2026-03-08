import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Hello API' })
  message!: string;
}

export class ProtectedDataResponseDto {
  @ApiProperty({ example: 'Hello Jane Doe' })
  message!: string;

  @ApiProperty({ example: 'usr_123' })
  userId!: string;

  @ApiProperty({ example: true })
  authenticated!: boolean;
}
