# デプロイ手順

## GitHub Pagesでデプロイする方法（コマンドラインのみ）

### 1. GitHub CLIをインストール

macOSの場合：
```bash
brew install gh
```

または、公式サイトからインストール：
https://cli.github.com/

### 2. GitHub CLIでログイン

```bash
gh auth login
```

### 3. GitHub Pagesを有効化

```bash
gh api repos/mizo0607/minigame/pages \
  -X POST \
  -f source[type]=branch \
  -f source[branch]=main \
  -f source[path]=/ \
  -f build_type=legacy
```

### 4. デプロイ状況を確認

```bash
gh api repos/mizo0607/minigame/pages
```

### 5. アクセスURL

デプロイが完了すると、以下のURLでアクセスできます：
```
https://mizo0607.github.io/minigame/
```

## 自動デプロイ

`main`ブランチにプッシュすると、GitHub Actionsが自動的にデプロイします。

## トラブルシューティング

もしGitHub Pagesが有効化されていない場合は、以下のコマンドで確認：
```bash
gh api repos/mizo0607/minigame/pages
```

エラーが出る場合は、GitHubのWebインターフェースで一度設定してください：
1. https://github.com/mizo0607/minigame/settings/pages にアクセス
2. Source: 「GitHub Actions」を選択
3. Save
