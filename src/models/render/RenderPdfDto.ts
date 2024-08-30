import { IsString } from "class-validator";

export class RenderPdfDto {
  @IsString()
  html: string;
}
