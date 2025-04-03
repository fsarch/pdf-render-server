import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum PaperFormat {
  LETTER = 'letter',
  LEGAL = 'legal',
  TABLOID = 'tabloid',
  LEDGER = 'ledger',
  A0 = 'a0',
  A1 = 'a1',
  A2 = 'a2',
  A3 = 'a3',
  A4 = 'a4',
  A5 = 'a5',
  A6 = 'a6',
  CUSTOM = 'custom',
}

export class RenderPdfViewportOptionsDto {
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  width: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty()
  height: number;
}

export class RenderPdfExportOptionsDto {
  @IsString()
  @IsEnum(PaperFormat)
  @ApiProperty({
    enum: PaperFormat,
  })
  format: PaperFormat;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  width: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  height: number;
}

export class RenderPdfOptionsDto {
  @ApiProperty()
  viewport: RenderPdfViewportOptionsDto;

  @ApiProperty()
  export: RenderPdfExportOptionsDto;
}

export class RenderPdfContentDto {
  @IsString()
  @ApiProperty()
  html: string;
}

export class RenderPdfDto {
  @ApiProperty()
  content: RenderPdfContentDto;

  @ApiProperty()
  options: RenderPdfOptionsDto;
}
