import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { GlobalService } from '../global.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(
    private gs: GlobalService,
  ) {}

  image: string
  imageFlag: Boolean = false
  imgHeight: number = 600;  // 指定
  imgWidth: number = 0

  canvasWidth: number = 300

  label_color: {} = {
    "apple": "#ff0000",
    "orange": "#ff4500",
    "banana": "#ffff00"
  }

  threshold_level: number = 0.5

  loadPicture = (e: any) => {
    var file: any = e.srcElement.files[0];
    var fileReader: any = new FileReader();
    var img = new Image();
    fileReader.onloadend = () => {
      img.onload = () => {
        // 画像軽量化
        console.log('Image Processing');
        const imgType = img.src.substring(5, img.src.indexOf(';'));
        this.imgWidth = img.width * (this.imgHeight / img.height);
        const canvas = document.createElement('canvas');
        canvas.width = this.imgWidth;
        canvas.height = this.imgHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, this.imgWidth, this.imgHeight);
        this.image = canvas.toDataURL(imgType);
        console.log(this.image);
      }
      // 画像ファイルを base64 文字列に変換します
      img.src = fileReader.result;
      this.imageFlag = true;
    };
    if (file) {
      fileReader.readAsDataURL(file);
    }
  }

  detect = () => {
    let url: string = environment.cv_endpoint + 'customvision/v3.1/Prediction/'
                      + environment.project_id + '/detect/iterations/'
                      + environment.published_name + '/image'
    // console.log(url)
    let blob = this.makeblob(this.image)
    this.gs.httpPostOctet(url, blob).subscribe(
      res => {
        console.log(res)

        // 画像の反映
        const board: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('canvas')
        let width: number = this.canvasWidth
        let height: number = this.canvasWidth / this.imgWidth * this.imgHeight
        board.width = width
        board.height = height
        const ctx = board.getContext('2d')
        const image: HTMLImageElement = new Image()
        image.src = this.image
        image.onload = () => {
          ctx.drawImage(image, 0, 0, width, height)
          ctx.font = "12px serif"
          ctx.fillStyle = '#000000';

          // 結果確認と結果描画
          res["predictions"].forEach(
            p => {
              // 結果確認
              if (p["probability"] > this.threshold_level) {
                console.log(p)

                // 結果描画
                //// ラベル
                ctx.fillText(p["tagName"], width * p["boundingBox"]["left"], height * p["boundingBox"]["top"])
                //// ボックス
                ctx.strokeStyle = this.label_color[p["tagName"]]
                ctx.strokeRect(width * p["boundingBox"]["left"], height * p["boundingBox"]["top"], width * p["boundingBox"]["width"], height * p["boundingBox"]["height"]);
              }
            }
          )     
        }
      }
    )
  }

  makeblob = (dataURL: string) => {
    const BASE64_MARKER = ';base64,';
    const parts = dataURL.split(BASE64_MARKER);
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }

}
