import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

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
  width: number;

  @IsNumber()
  @IsPositive()
  height: number;
}

export class RenderPdfExportOptionsDto {
  @IsString()
  @IsEnum(PaperFormat)
  format: PaperFormat;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  width: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  height: number;
}

export class RenderPdfOptionsDto {
  viewport: RenderPdfViewportOptionsDto;

  export: RenderPdfExportOptionsDto;
}

export class RenderPdfContentDto {
  @IsString()
  html: string;
}

export class RenderPdfDto {
  content: RenderPdfContentDto;

  options: RenderPdfOptionsDto;
}
