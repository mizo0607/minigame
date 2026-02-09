#!/bin/bash

# GitHub Pagesを有効化するスクリプト
# 使用方法: ./deploy.sh [GitHub Personal Access Token]

GITHUB_TOKEN=$1
REPO_OWNER="mizo0607"
REPO_NAME="minigame"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "エラー: GitHub Personal Access Tokenが必要です"
    echo ""
    echo "使用方法: ./deploy.sh [GitHub Personal Access Token]"
    echo ""
    echo "Personal Access Tokenの取得方法:"
    echo "1. https://github.com/settings/tokens にアクセス"
    echo "2. 'Generate new token (classic)' をクリック"
    echo "3. 'repo' と 'workflow' の権限を選択"
    echo "4. トークンを生成してコピー"
    echo ""
    exit 1
fi

echo "GitHub Pagesを有効化しています..."

# GitHub Pagesの設定を更新
curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pages" \
  -d '{
    "source": {
      "branch": "main",
      "path": "/"
    },
    "build_type": "workflow"
  }'

echo ""
echo "設定が完了しました！"
echo ""
echo "デプロイ状況を確認するには:"
echo "curl -H \"Authorization: token $GITHUB_TOKEN\" https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pages"
echo ""
echo "デプロイが完了すると、以下のURLでアクセスできます:"
echo "https://$REPO_OWNER.github.io/$REPO_NAME/"
