# デプロイ手順

## 現在の状態
- ✅ GitHub Actionsのワークフローは設定済み
- ⚠️ GitHub Pagesの有効化が必要

## デプロイ方法

### 方法1: GitHubのWebインターフェースで設定（最も簡単）

1. 以下のURLにアクセス：
   ```
   https://github.com/mizo0607/minigame/settings/pages
   ```

2. 「Source」セクションで「GitHub Actions」を選択

3. 「Save」をクリック

4. 数分待つと、以下のURLでアクセスできます：
   ```
   https://mizo0607.github.io/minigame/
   ```

### 方法2: コマンドラインで設定

1. GitHub Personal Access Tokenを取得：
   - https://github.com/settings/tokens にアクセス
   - 「Generate new token (classic)」をクリック
   - `repo` と `workflow` の権限を選択
   - トークンを生成してコピー

2. デプロイスクリプトを実行：
   ```bash
   ./deploy.sh [あなたのトークン]
   ```

## 自動デプロイ

設定後は、`main`ブランチにプッシュするだけで自動的にデプロイされます。

## デプロイ状況の確認

- GitHub Actions: https://github.com/mizo0607/minigame/actions
- GitHub Pages設定: https://github.com/mizo0607/minigame/settings/pages
