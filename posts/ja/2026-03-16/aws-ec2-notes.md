---
title: "AWS EC2 メモ（起動、リサイズ、配置、SSH、CloudWatch Agent、ステータスチェック、Hibernate、Instance Scheduler、AMI、Image Builder）"
date: "2026-03-16"
excerpt: "EC2の要約メモ：起動、リサイズ、配置グループ、SSH/Instance Connect、CloudWatchとエージェント、ステータスチェック、Hibernate、Instance Scheduler、AMI（作成、No-Reboot、クロスアカウント）、EC2 Image Builder、本番でのAMI。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "ec2", "cloudops", "certification", "cloudwatch", "security", "ssm", "ami", "image-builder"]
---

## インスタンスの起動

- **名前**、**AMI**（例：Amazon Linux）、**インスタンスタイプ**（例：無料枠なら t2.micro）。
- **キーペア：** 作成または選択。SSH用にRSA PEM。`.pem` を保存（例：Downloads）。
- **ネットワーク設定：** セキュリティグループを作成または編集。SSH（22番）を自分のIPまたはデモ用にどこからでも許可。
- **ストレージ：** デフォルトで通常問題なし（EBS-backed）。
- **接続：** インスタンスの **パブリックIPv4** をコピーし、ターミナルで：
  - `chmod 400 YourKey.pem`（必須。権限が違うと「unprotected private key file」）。
  - `ssh -i YourKey.pem ec2-user@<public-ip>`（ユーザー名はAMI次第：Amazon Linux は `ec2-user`、Ubuntu は `ubuntu`）。
- **EC2 Instance Connect：** コンソールで「EC2 Instance Connect」を開く。ユーザー名が提案され、ブラウザ内シェルが開く。自分のキーは不要。AWSが**1回限りのSSH公開鍵**（60秒有効）をプッシュし、EC2 Instance Connect のIPレンジから接続する。

## インスタンスタイプの変更（リサイズ）

- **EBS-backed のインスタンスのみ。** 手順：インスタンスを **stop** → **インスタンスタイプを変更**（例：t2.micro → t2.small）→ **start**。
- stop/start 後、**別の物理ホスト**で動くことがある。**EBSストレージは維持**（データ・ファイル・OSは同じ）。Instance store は永続しない。
- **EBS最適化：** 新しい世代（例：t3）はデフォルトで EBS 最適化（EBSスループット向上）。t2.small など古いタイプは対応していない場合がある。
- t2.small（および t2.micro 以外の多く）は**無料枠外**で課金される。無料枠で練習するなら t2.micro を推奨。

## プレースメントグループ

EC2インスタンス同士の配置方法を制御（ハードウェアは直接選べないが戦略は指定する）。

| 戦略 | 説明 | ユースケース |
|------|------|--------------|
| **Cluster** | 同一AZ内、低レイテンシ／同一「クラスタ」のハードウェア。enhanced networking でインスタンス間約10Gbps。 | 高性能・ビッグデータ・低レイテンシアプリ。**リスク：** AZ障害で全て停止。 |
| **Spread** | インスタンスごとに**別ハードウェア**。複数AZにまたげる。**1AZあたり最大7インスタンス**（spread プレースメントグループ単位）。 | HA最大化。インスタンス障害を分離したい重要アプリ。 |
| **Partition** | **パーティション**（1パーティション≈1ラック）に分散。**1AZあたり最大7パーティション**。複数AZにまたげる。1パーティションに複数インスタンス。**数百台/グループ**まで。 | パーティション対応アプリ：HDFS、HBase、Cassandra、Kafka。1パーティション障害で他は落ちない。 |

## SSHと接続トラブルシューティング

- **「Unprotected private key file」：** PEMの権限を修正。例：`chmod 400 YourKey.pem`。
- **「Permission denied」／「Host key not found」／「Connection closed」：** AMIに合わない**ユーザー名**（例：Amazon Linux で `ubuntu`）。AMIに正しいユーザーを使う。
- **接続タイムアウト：** 多くは**ネットワーク/セキュリティ**。確認：
  - **セキュリティグループ：** インバウンドSSH（22）を自分のIP（または EC2 Instance Connect を使う場合はそのレンジ）から許可。
  - インスタンスのサブネットの**ルートテーブル**と**NACL**。
  - インターネットから到達したい場合はインスタンスに**パブリックIPv4**があること。
  - インスタンスが**過負荷**（例：CPU 100%）でなく、新規接続を受け付けられること。

**EC2 Instance Connect と SSH：**

- **SSH：** セキュリティグループで自分のIPを許可（インバウンド22）。自分のキーペアを使う。
- **EC2 Instance Connect：** 自分のキーは使わない。AWSが短期キーをプッシュし、**EC2 Instance Connect サービスのIPレンジ**から接続する。セキュリティグループでは「My IP」だけでなく**そのレンジからのSSH（22）**を許可する必要がある。[AWS IP address ranges](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html) のJSONでサービス「EC2 Instance Connect」とリージョンを指定してレンジを取得。

## EC2 Instance Connect エンドポイント（プライベートインスタンス）

**プライベートサブネット**のEC2インスタンス（インターネット直接アクセスなし）用：

- **EC2 Instance Connect エンドポイント**（そのサービスのVPCエンドポイント）を作成。
- エンドポイントに**セキュリティグループ**を付け、ターゲットインスタンスへの**アウトバウンドSSH**を許可。
- ターゲットインスタンスのセキュリティグループで、**エンドポイントのセキュリティグループからのインバウンドSSH**を許可。
- インスタンスに**インターネットゲートウェイ**・**NATゲートウェイ**・パブリックIPは不要。エンドポイント経由で接続し、EC2 Instance Connect でプライベートインスタンスに接続。

## CloudWatch と EC2（試験向け）

- **基本モニタリング：** **5分**間隔のメトリクス（追加料金なし）。
- **詳細モニタリング：** **1分**間隔（追加料金）。
- **組み込みEC2メトリクス**（AWSがプッシュ）：**CPU**（使用率。T2/T3バーストならクレジット使用量・残高）、**ネットワーク**（in/out、パケット）、**ステータスチェック**（instance = VMの健全性、system = 基盤ハードウェア、EBS = アタッチされたボリューム）、**ディスク**読み書きは**instance store-backed**のインスタンスのみ（EBS-backed ではディスクメトリクスはCloudWatchの**EBSボリューム**側にあり、EC2インスタンスには出ない）。
- **RAMはデフォルトのEC2メトリクスに含まれない** — 試験でよく出る。インスタンスから**カスタムメトリクス**（例：RAM、アプリレベル）をプッシュする必要がある。解像度は1分、または高解像度で**1秒**まで。インスタンスにCloudWatchへメトリクスを発行する**IAMロール**が必要。

## Unified CloudWatch Agent

- **EC2またはオンプレ**サーバー向け：**追加のシステムメトリクス**（RAM、ディスク、プロセスなど）を収集し、**ログ**をCloudWatch Logsへ送る。デフォルトではエージェントなしではEC2インスタンスからログもカスタムメトリクスも送られない。
- **設定：** SSM Parameter Store（複数インスタンス向けに中央管理、推奨）またはローカル設定ファイル。インスタンス（またはオンプレサーバー）にCloudWatch（メトリクス＋ログ）用の**IAM権限**、SSMを使う場合はParameter Store用の権限が必要。
- **ネームスペース：** エージェントがプッシュするメトリクスはデフォルトで**CWAgent**ネームスペース（変更可）。
- **procstat プラグイン（試験）：** Linux/Windowsで**プロセス単位**のメトリクス（CPU使用率、メモリ/プロセス）を取る**唯一**の方法は**Unified CloudWatch Agent**の**procstat**プラグイン。**PIDファイル**・**プロセス名**・**パターン**でプロセスを指定。メトリクスは**procstat_**プレフィックス（例：`procstat_cpu_usage`、`procstat_time`）。

## CloudWatch エージェントのインストールと設定

- **IAMロール：** **CloudWatchAgentServerPolicy**（メトリクス投入、ログ送信、SSMからパラメータ取得）を持つEC2ロールを作成。セットアップ時にエージェント設定をSSMに**保存**する場合は**CloudWatchAgentAdminPolicy**（put parameter）も必要。セットアップ後はadminを外してserverのみにしてもよい。ロールをインスタンスにアタッチ。
- **インストール：** `sudo yum install -y amazon-cloudwatch-agent`（Amazon Linux 2）。続けて**ウィザード**実行：`sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard` — Linux、EC2、rootユーザーを選択。StatsD/CollectDは任意（CollectDを有効にしたが未インストールだとエージェントが起動しない）。ホストメトリクス（CPU、**memory**）を有効化。EC2ディメンションを追加。解像度（1秒〜60秒）。必要ならログファイルパス（例：`/var/log/httpd/access_log`、`error_log`）とロググループ名・保持期間を追加。ウィザードがJSONを出力。**SSM Parameter Store**（例：`AmazonCloudWatch-Linux`）に保存すると他インスタンスから取得できる。
- **SSMから起動：** `sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-Linux`。またはローカル設定で `-c file:path/to/config.json`。ロググループ・ストリームはCloudWatch Logsに、メトリクス（例：`mem_used_percent`、ディスク、CPU、ネットワーク、プロセス、スワップ）は**CWAgent**ネームスペースに表示される。

## ステータスチェックとリカバリ

- **システムステータスチェック：** AWSが**物理ホスト**（電源、ハードウェア）を監視。失敗したら**stop**のあと**start**（rebootではない）でインスタンスを**別ホストへ移行**（新しいパブリックIP。EBSデータは同じ）。インスタンスに影響する予定メンテは**Personal Health Dashboard**で確認。
- **インスタンスステータスチェック：** インスタンス上のソフトウェア・ネットワーク設定（例：メモリ枯渇、無効なネットワーク設定）。**リブート**またはインスタンス設定の変更で対応。
- **EBSステータスチェック：** アタッチされたEBSボリュームが到達可能でI/Oできるか。失敗時は**リブート**または該当ボリュームの**交換**。
- **CloudWatchメトリクス：** `StatusCheckFailed_System`、`StatusCheckFailed_Instance`、`StatusCheckFailed_AttachedEBS`、および `StatusCheckFailed`（3つのいずれか）。アラームに利用。
- **リカバリの選択肢：**
  1. **CloudWatchアラームの「Recover」アクション：** ステータスチェック失敗（例：system）でアラームが発火し、AWSがインスタンスを**リカバリ**（別ホストへ移行）。**同じプライベートIP・パブリックIP・EIP・メタデータ・プレースメントグループ**を維持。SNS通知も可能。インスタンスレベル（ソフトウェア）の問題には**「Reboot」**アクション。
  2. **min = max = desired = 1 のASG：** EC2ステータスチェックでヘルスチェック。unhealthyなインスタンスは終了し、ASGが新しいインスタンスを起動。同じIP/EBSアタッチは失う。代替可能で状態復元の自動化がある場合に使用。

## EC2 Hibernate

- **Stop**はEBSデータを保持。**Terminate**はボリュームを削除または保持可能。**Start**はOSフルブート＋user data＋アプリ起動（遅い）。
- **Hibernate：** RAMを**ルートEBSボリューム**に書き出してからインスタンスが停止。Start時はRAMを**ディスクからロード** — OS的には停止していない（例：`uptime`が続く）。**高速**再開。アプリ/キャッシュの再初期化なし。
- **要件：** ルートボリュームは**EBS**で**暗号化**され、インスタンスのRAMを格納できる**十分なサイズ**。HibernateのRAM上限は現在&lt;150GB（要確認）。Bare metalは非対応。on-demand、reserved、spotで利用可能。Hibernate期間は通常制限あり（例：60日まで）。
- **有効化：** 起動時に**Stop - Hibernate**の動作を設定。ルートボリュームを暗号化し、RAM用にサイズ（例：1GB RAMなら8GBルート）。hibernate → start 後も `uptime` はリセットされない。

## Instance Scheduler（AWSソリューション）

- **サービスではなく** — **CloudFormation**でデプロイする**AWSソリューション**。EC2インスタンス・RDSインスタンス・EC2 Auto Scalingグループをスケジュールで**自動起動/停止**し**コスト削減**（例：営業時間外）。
- **仕組み：** スケジュールは**DynamoDB**テーブルに格納。**Lambda**（例：5分ごとのスケジュールで起動）がテーブルを読み、他のLambdaでリソースの起動/停止を実行。**クロスアカウント**・**クロスリージョン**対応。リソースにスケジュール用タグ（例：`Schedule`）を付与してソリューションが対象を判別。
- **デプロイ：** 「Instance Scheduler AWS」で検索 → ソリューションのページ → **Launch solution** → CloudFormationがテンプレートURLで開く。パラメータ：タグキー、デフォルトタイムゾーン、有効/無効、サービス（EC2、RDS、Neptune、DocumentDB、ASG）、停止時のRDSスナップショットなど。デプロイ後、DynamoDBの設定テーブルでスケジュール（例：営業時間、平日）を設定。試験ではこのソリューションの**目的**（スケジュール起動/停止によるコスト削減）が問われることがある。

## AMI（Amazon Machine Image）

- **概要：** EC2インスタンスのカスタマイズ — OS、ソフトウェア、監視ツール。カスタムAMIから起動すると**ブートと設定が速い**（すべて事前パッケージ済み）。AMIは**リージョン固有**。リージョン間でコピー可能。
- **ソース：** **パブリック**（AWS、例：Amazon Linux 2）、**自作**（作成・維持。ツールで自動化可）、**AWS Marketplace**（サードパーティAMI、多くは有料）。
- **インスタンスから作成：** インスタンスをカスタマイズ → **停止**（ファイルシステム整合性のため）→ 右クリック → **Image and templates** → **Create image**。裏でEBSスナップショットが作成される。**AMIs** → **My AMIs**（または起動フローの「From AMI」）から新しいインスタンスを起動。自作AMIからはブートが速い（user dataをフルで再実行する必要がない）。
- **AZ間の移行：** AZ AのインスタンスからAMIを作成し、そのAMIから**起動**する際に**AZ Bのサブネット**を選択 — 同じデータとアプリを別AZで。

## AMI：No-Reboot オプション

- **デフォルト：** AMI作成時にインスタンスを**シャットダウン**してからEBSボリュームをスナップショット → **ファイルシステム整合性**を確保。
- **No-Reboot 有効：** **稼働中**のインスタンスからスナップショットを取得。**リスク：** ファイルシステムの一貫性は保証されない。OSバッファがフラッシュされていない可能性。そのトレードオフを許容する場合のみ使用。
- **AWS Backup：** BackupがEC2のAMIを作成する際はインスタンスを**リブートしない**（no-reboot動作）。そのためBackupはファイルシステム整合性を**保証しない**。**整合性を保ったスケジュールAMIバックアップ**には、例：**EventBridge**（スケジュール）→ **Lambda** → リブート**あり**でAMI作成（インスタンス停止、イメージ作成、起動）。

## AMI：クロスアカウント共有とコピー

- **共有：** 他アカウントにAMIを共有。**所有者は変わらない**。**暗号化なし**AMI：特定アカウントと共有または公開。**暗号化**（カスタマーマネージドキー、CMK）：**KMSキー**もターゲットアカウントと**共有**（describe、decrypt、re-encryptなど）し、そのアカウントがAMIから起動できるようにする。
- **コピー（クロスアカウント）：** ターゲットアカウントが共有AMIを**コピー**して自アカウントに取り込む → **新AMIの所有者**になる。ソースは**基盤EBSスナップショット**への**読取**を許可する必要がある。暗号化されている場合はソースがCMKを共有。ターゲットはコピー時に**自アカウントのCMKで再暗号化**可能。
- **コンソール：** **Actions** → **Edit AMI permissions** → アカウントIDまたはorg/OUのARNを追加。必要に応じて**関連スナップショットへのcreate volume権限を追加**し、他アカウントがAMIを使えるようにする。

## EC2 Image Builder

- **目的：** AMI（およびコンテナイメージ）の**作成・維持・検証・テスト**を自動化。試験で出題されやすい。
- **フロー：** Image Builderが**ビルダーEC2インスタンス**を起動 → **ビルドコンポーネント**（Java、AWS CLI v2、アプリ、更新などのインストール）を実行 → **AMI**を作成 → そのAMIから**テストインスタンス**を起動 → **テスト**を実行（任意。セキュリティ、アプリチェックなど）→ AMIを**配布**（例：複数リージョン）。一連の流れが自動。
- **レシピ：** **ソースイメージ**（例：Amazon Linux 2、x86）と**コンポーネント**（AWS管理またはカスタム）を定義。コンポーネントの順序を指定可能。t2.microなどでビルドする場合は**x86**ソース（ARM64は不可）。
- **インフラ設定：** ビルド/テスト用インスタンスタイプ、**IAMインスタンスプロファイル**（**EC2InstanceProfileForImageBuilder**、**ECRContainerBuilds**（Docker用）、**AmazonSSMManagedInstanceCore**）。
- **配布：** どのリージョンにAMIを配布するか。複数リージョンへ自動配布可能。
- **スケジュール：** 手動、または週次／依存関係更新時（CRON）など。**無料のサービス** — ビルドで使うEC2とストレージ、およびAMI/スナップショットのストレージのみ課金。
- **クリーンアップ：** AMIを登録解除し、**基盤EBSスナップショット**を**削除**する。

## 本番でのAMI

- **事前承認AMI：** AMIにタグ（例：`environment=prod`）を付与。**IAMポリシー**で `ec2:RunInstances` を**そのタグが付いたAMIの場合にのみ**許可する**条件**を付ける → ユーザーは承認済みAMIからしか起動できない。AMIにタグを付けられるユーザーを制限する。
- **AWS Config：** EC2インスタンスをチェックするルールを定義。**非準拠**インスタンス（承認/タグ付けされていないAMIから起動されたもの）を検出。準拠インスタンスはグリーン。非準拠には対応を取る。

---
> 🌐 *Claudeによる翻訳*
