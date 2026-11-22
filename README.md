# 数の単位ぼえーる（PWA）

大きい数（一〜無量大数）と小さい数（割〜涅槃寂静）を、読み・10の累乗つきで暗記するアプリ。

## GitHub Pages で公開
1. このフォルダの中身をリポジトリのルート（または /docs）に置いて push
2. Settings → Pages → Branch: main / (root) を選択して Save
3. 表示された URL を Galaxy の Chrome で開く → メニュー「ホーム画面に追加」（インストール）

パスはすべて相対指定なので、`https://<user>.github.io/<repo>/` のようなサブパスでも動作します。
更新したら sw.js の `CACHE` 名（kazu-v1 → v2）を変えると端末のキャッシュが更新されます。

## 学習記録
端末内（localStorage）に保存。日時・正答数・間違えた単位を記録します。
