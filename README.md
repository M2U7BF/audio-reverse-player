# 🔁 逆再生メーカー (Audio Reverse Player)

音声ファイルをブラウザにドラッグ＆ドロップ、またはその場でマイク録音するだけで、**逆再生** に変換・再生・WAVダウンロードできるシンプルなWebアプリです。サーバーには一切アップロードされず、すべて [Web Audio API](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API) を使ってクライアント側（ブラウザ）だけで処理されます。

## デモ

GitHub Pages: https://M2U7BF.github.io/audio-reverse-player/

## 使い方

### ファイルから変換する場合
1. サイトを開く
2. 音声ファイル（MP3 / WAV / OGG / M4A など）をドロップ、またはクリックして選択
3. 自動的に逆再生バージョンが生成される
4. 元の音声・逆再生音声をそれぞれ再生して聴き比べ
5. 「WAVでダウンロード」ボタンで逆再生した音声を保存

### その場で録音する場合
1. 「🎙️ その場で録音」の「録音開始」ボタンを押す（マイクアクセスの許可が必要）
2. 話し終えたら「録音停止」を押す
3. 録音した音声がそのままアップロードされたのと同じ扱いで逆再生に変換される

## 仕組み

- ファイル読み込み: `AudioContext.decodeAudioData()` で音声をデコード
- その場録音: `navigator.mediaDevices.getUserMedia()` + `MediaRecorder` でマイク音声を録音し、停止時にファイルアップロードと同じ処理パイプラインへ渡す
- 各チャンネルの `Float32Array` サンプルを先頭と末尾から入れ替えて反転
- `AudioBufferSourceNode` でその場で再生
- 16bit PCM の WAV ファイルとしてエンコードしてダウンロード提供

## ローカルで動かす

ビルド不要の静的サイトです。任意のHTTPサーバーで配信するだけで動きます。

```bash
npx serve .
# もしくは
python -m http.server 8000
```

## ライセンス

MIT License
