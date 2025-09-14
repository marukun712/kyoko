# kyoko

kyokoは、aikyoで動作するAIコンパニオンです。

# Usage

## Clone

submoduleを含めてcloneします。
```bash
git clone --recursive git@github.com:marukun712/kyoko.git
```

## Animations

Mixamoのライセンス上アニメーションの再配布ができないため、手動でアニメーションを配置する必要があります。

まず、public/フォルダに待機モーションを追加します。

Mixamoからお好きな待機モーションをダウンロードして、idle.fbxとしてpublicフォルダに保存します。

次に、モーションデータベースの作成を行います。
以下の手順では、Geminiを使ってアニメーションラベルを自動生成し、ベクトル化してコンパニオンが適切なアニメーションを検索できるようにします。

motiondb/に.envを作成して、GeminiのAPIキーを入力します。

```bash
cd motiondb/
cp .env.example .env
cd ../
```

モーションデータベースを起動します。
```bash
docker-compose -f motiondb/docker-compose.yml up
```

`http://localhost:7860`にアクセスします。

アップローダーに、使いたいMixamoモーションをアップロードしていきます。

アニメーションファイルの名前に動作の内容などが含まれている場合、ファイル名からラベルを生成するにチェックを入れることで高速にラベル化を行うことができます。

アニメーション名から動作を推測できない場合は、アニメーションが自動でレンダリングされ、その映像からGeminiがラベルを生成します。

アニメーションを全てアップロードしたら、AIコンパニオンを起動します。

## Companion

必要に応じてVOICEVOXサーバーを起動します。
```bash
docker-compose -f voicevox.yml up
```

```bash
docker-compose up
```

`http://localhost:3030`にアクセスします。

Startボタンをクリックして、コンパニオンとの会話を始めましょう。

また、下部に表示されているEnter VRボタンを押下することで、Looking Glass Go向け立体表示をすることができます。
