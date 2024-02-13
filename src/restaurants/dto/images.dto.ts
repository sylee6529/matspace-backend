export class ImagesDto {
  name: string;
  imgUrl: string;

  constructor(data: any) {
    this.name = data.name;
    this.imgUrl = data.imgUrl;
  }
}
