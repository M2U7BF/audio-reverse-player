# 🔁 逆再生メーカー (Audio Reverse Player)

音声ファイルをブラウザにドラッグ＆ドロップするだけで、その場で **逆再生** に変換・再生・WAVダウンロードできるシンプルなWebアプリです。サーバーには一切アップロードされず、すべて [Web Audio API](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API) を使ってクライアント側（ブラウザ）だけで処理されます。

## デモ

GitHub Pages: `https://<your-username>.github.io/audio-reverse-player/`

## 使い方

1. サイトを開く
2. 音声ファイル（MP3 / WAV / OGG / M4A など）をドロップ、またはクリックして選択
3. 自動的に逆再生バージョンが生成される
4. 元の音声・逆再生音声をそれぞれ再生して聴き比べ
5. 「WAVでダウンロード」ボタンで逆再生した音声を保存

## 仕組み

- `AudioContext.decodeAudioData()` で音声をデコード
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
