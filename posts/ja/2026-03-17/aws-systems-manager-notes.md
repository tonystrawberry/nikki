---
title: "AWS Systems Manager メモ（概要、Fleet Manager、DHMC、ドキュメント、Run Command、Session Manager、Automation、Parameter Store、Inventory、State Manager、Distributor、Patch Manager、Maintenance Windows、OpsCenter）"
date: "2026-03-17"
excerpt: "AWS Systems Manager の要約メモ：エージェント、Fleet Manager、DHMC、ドキュメント、Run Command、Session Manager、Automation、Parameter Store、Inventory、State Manager、Distributor、Patch Manager、Maintenance Windows、OpsCenter（OpsItems、runbooks）。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "systems-manager", "ssm", "cloudops", "certification", "ec2", "fleet-manager", "run-command", "session-manager", "automation", "parameter-store", "inventory", "state-manager", "distributor", "patch-manager", "maintenance-windows", "opscenter"]
---

## 概要

**AWS Systems Manager** は **EC2 インスタンスとオンプレミスサーバーのフリートをまとめて管理**するツール群です。CloudOps 試験でよく出ます。用途は次のとおりです。

- インフラの状態の **可視化**  
- **問題の検出** と **パッチの自動化**  
- **コンプライアンス**（設定、パッチ適用など）

**Windows と Linux** をサポートし、**CloudWatch**（メトリクス、ダッシュボード）や **Config** と連携します。**無料**で、利用・作成するリソース（例：Automation 用 EC2）分のみ課金されます。

**SSM を思い出す場面：** インスタンスへのパッチ適用、オートメーションの実行、多数のインスタンス／オンプレの管理には Systems Manager が関わることが多いです。

## SSM の仕組み

- 管理対象のシステムには **SSM エージェント** のインストールが必要です。  
- **Amazon Linux 2** と一部 **Ubuntu** AMI には **プリインストール** されています。  
- インスタンスが SSM で **管理対象として表示されない** 場合は次を確認します。  
  1. **SSM エージェント** — 未起動・未インストール・設定ミス。  
  2. **IAM** — インスタンス（またはオンプレサーバー）が Systems Manager と通信するための IAM ロール（または認証情報）を持っていること。  
- **インスタンス（またはサーバー）が SSM に接続する** 方式のため、SSM がこちらから接続する必要はありません。そのため、管理のための **インバウンド SSH / HTTP 等は不要** で、AWS API へのアウトバウンドアクセス（と正しい IAM ロール）があれば十分です。

## Fleet Manager

- **Fleet Manager** は、Systems Manager に登録した **全ノードを一元的にリモート管理** するための機能です。対象は **EC2 インスタンス**、**オンプレのサーバーや VM**、**Edge デバイス**、**IoT デバイス** です。**Windows と Linux** をサポートします。各ノードには **SSM エージェント** のインストールが必要です。
- **EC2 用 IAM：** **AmazonSSMManagedInstanceCore** を含む **IAM インスタンスプロファイル** を付与すると、インスタンスが SSM と Fleet Manager に登録できます。または **Default Host Management Configuration（DHMC）** でオンボーディングを簡略化できます。適切な権限・設定がないとノードは管理対象に表示されません。
- **Fleet Manager の用途：** 管理対象ノードを一覧で確認し、SSM アクションを一括実行します。**ノードの状態・健全性・パフォーマンスの把握**、**トラブルシュート・管理タスクの実行**、**アクセス**（**Windows RDP** や **Session Manager** による Linux の CLI アクセス）に使います。Fleet Manager は Run Command、Patch Manager、State Manager などの **SSM 機能をフリートに適用するハブ** です。
- **AmazonSSMManagedInstanceCore の権限（試験向け）：** インスタンスに次の権限を付与します。Systems Manager / Fleet Manager への **登録**、**Session Manager** の利用、**SSM ドキュメント** と **Parameter Store** パラメータの **読み取り**、**コマンドの受信・実行**（Run Command など）、**Patch Manager** の実行、**Inventory**・**Compliance**・設定状態への **レポート**。EC2 を SSM で十分に管理するには、このポリシー（または同等）をインスタンスに付与する必要があります。
- **EC2 の登録（復習）：** エージェント入り AMI（例：**Amazon Linux 2**）で起動し、**AmazonSSMManagedInstanceCore** のインスタンスプロファイルを付与します。必要に応じてインバウンドルールのないセキュリティグループを使います。エージェントが AWS に登録し、Fleet Manager にノード（プラットフォーム、OS、エージェントバージョン、ステータス）が表示されます。

## Default Host Management Configuration（DHMC）

- **目的：** **DHMC** を有効にすると、**EC2 インスタンスプロファイルを持たない** EC2 インスタンス（インスタンスに IAM ロールを付けない）でも **管理インスタンス** にできます。SSM へのアクセスは必要ですが、別の仕組みで付与されます。
- **仕組み：** 各 EC2 インスタンスには **インスタンス ID ドキュメント**（およびこのフローでは **インスタンス ID ロール** — 組み込みの無権限ロールでユーザーは制御しない）があります。役割は Systems Manager などの AWS サービスに **インスタンスを識別** させることです。EC2 インスタンスプロファイルとは **別物** です。インスタンスはこの ID で SSM に認証し、**Systems Manager が IAM ロールをインスタンスに渡し**、Session Manager、Run Command、Patch Manager などで管理できるようにします。**インスタンスプロファイルを付けずに** これが行われます。
- **要件：** インスタンスで **IMDSv2**（Instance Metadata Service v2）を有効にすること（例：EC2 の詳細で **Metadata version: V2 only**）。**SSM エージェント** は **3.2.x 以上**（DHMC 有効時に Fleet Manager に表示される最小バージョン）が必要です。古い AMI はエージェントが古い場合があり、登録前に **手動でエージェントをアップグレード** する必要があります。
- **オンボーディング後：** DHMC で管理されると、Session Manager、Patch Manager、Inventory などの SSM 機能が使え、**SSM エージェントは AWS により自動更新** されます。
- **スコープ：** DHMC は **リージョン単位** で有効化します。対象リージョンごとに有効にします。

**DHMC の有効化と利用（ハンズオン）：**

- **Fleet Manager**（左メニュー）で **Default host management** の設定を開きます。有効化し、**推奨** 設定で IAM ロールを作成します。このロールを SSM がインスタンスに渡します。EC2 インスタンスプロファイルとしては **付けません**。**Configure** で保存します。
- **テスト用インスタンスの起動：** SSM エージェント入り AMI（例：**Amazon Linux 2023**）を使用します。インスタンスプロファイルは **付けない**（セキュリティ → IAM ロール = なし）。**Advanced details** で **Metadata** を **V2 only**（IMDSv2）にします。起動すると、EC2 コンソールでは **IAM ロールなし** と表示されます。
- Fleet Manager に **表示されない** 場合はエージェントが古い可能性があります。Fleet Manager の UI で DHMC が要求する最小エージェントバージョンを確認し、インスタンス上で **エージェントをアップグレード** します。接続は Session Manager（他に管理ノードがある場合）や一時的に EC2 Instance Connect／キーで行います。SSM エージェントを停止し、OS とアーキテクチャ用の公式インストール手順（例：x86_64 の「Manually installing SSM agent on EC2 instances for Linux」）を実行してから起動します。アップグレード後（例：3.2.923 以上）、Fleet Manager を更新すると、インスタンスプロファイルがなくても **管理ノード** として表示されるはずです。
- DHMC を無効にする：Fleet Manager → Default host management → Configure → Disable。テスト用インスタンスは終了します。

## タグとリソースグループ

- **タグ** は AWS リソース（EC2、S3、DynamoDB、Lambda など）のキー・値ペアです。**リソースのグループ化**、**オートメーション**、**セキュリティ**、**コスト配分** に使います。よく使うキー：`Environment`、`Team`。少より多めのタグがおすすめです。  
- **リソースグループ** は **タグフィルター**（例：`Environment = dev`）でリソースをグループ化します。Resource Groups は **リージョナル** です。リソースタイプ（例：EC2 のみ）や複数タイプでスコープできます。  
- **SSM で使う理由：** SSM アクションを **グループ単位** で実行できます（例：「dev」グループの全インスタンスにパッチ、または「finance」の全インスタンスでコマンド実行）。`Environment` や `Team` などでリソースグループを作成しておくことが、後の SSM グループ操作の前提になります。

## ドキュメント

- **ドキュメント** は SSM の中心です。**JSON または YAML** で定義し、**パラメータ** と **ステップ**（アクション）を記述します。ドキュメントは Run Command、State Manager、Patch Manager、Automation などの SSM 機能によって実行されます。
- **所有：** 多くのドキュメントは **Amazon 提供**（例：`AWS-ApplyPatchBaseline`）です。**自作** も作成・バージョン管理できます。他アカウントと **共有** 可能です。
- **用途：** 単一コマンドやスクリプトをインスタンス群で実行；**State Manager**、**Patch Manager**、**Automation** で使用；**Parameter Store** から読み取って動的に振る舞いを変えられます。
- **ドキュメントタイプ：** **Command/Session**（ターゲットでコマンド実行）または **Automation**（インスタンス外から AWS リソースに作用する runbooks）。Automation ドキュメントは **runbooks** と呼ばれることが多いです。

## Run Command

- **Run Command** は **ドキュメント**（または単一コマンド）を **EC2 インスタンスのフリート** で実行します。ターゲットは **インスタンス ID**、**タグ**、**リソースグループ** で指定します。**SSH は不要** で、SSM エージェントがコマンドを実行するため、インスタンスでポート 22 を開ける必要はありません。
- **レート制御：** 一度にターゲットの一部だけ実行（例：1 台ずつ、50 台ずつ、または割合）して負荷や一斉適用を抑えます。
- **エラーしきい値：** 失敗数または失敗率で実行を停止（例：最初のエラーで停止、または 5% 超で停止）。
- **出力：** コンソールで確認（文字数制限あり）、**S3** または **CloudWatch Logs**（stdout/stderr を別ストリームなど）に送れます。
- **通知：** ステータス（進行中、成功、失敗）を **SNS** に送信できます。**EventBridge**（CloudWatch Events）ルールで **Run Command を呼び出し**（スケジュールやイベントで）可能です。**IAM** と **CloudTrail**（誰が何を実行したかの監査）と統合されています。
- **例：** パラメータ（例：`message`）とステップ（httpd のインストール・起動、パラメータを使った HTML 書き出し）を持つ **コマンドドキュメント**（YAML）を作成し、Run Command で複数インスタンスにレート制御（例：1 台ずつ）とエラーしきい値を指定して実行。出力を CloudWatch Logs に送信。

## Session Manager

- **目的：** EC2 インスタンスとオンプレサーバーで **SSH を使わず** **セキュアなシェル（CLI）セッション** を開始します。バストンや SSH キーは不要です。**コンソール**、**CLI**、**Session Manager SDK** からアクセスします。従来の SSH や **EC2 Instance Connect**（SSH 使用）と異なり、Session Manager は **SSM サービス** を仲介するため、インスタンスはインバウンド SSH を受け付けません。
- **仕組み：** インスタンスで **SSM エージェント** が動き、SSM に登録する **IAM** 権限を持ちます。**ユーザー** は IAM 権限で **Session Manager サービス** に接続し、Session Manager がインスタンス上で **対話シェル** を実行します。**Run Command** と同じ基盤ですが、**1 回のコマンド** ではなく **ライブシェル** です。**Linux**、**macOS**、**Windows** をサポートします。
- **ログとコンプライアンス：** すべての **接続** と **実行コマンド** を **S3** または **CloudWatch Logs** に **ログ** でき、監査とセキュリティ／コンプライアンスを強化できます（SSH ではコマンド履歴が一元的に取れない）。**CloudTrail** で Session Manager セッション開始時の **StartSession** イベントを記録し、オートメーション・コンプライアンス・アラートに利用できます。
- **IAM：** IAM で **誰が** Session Manager を使え、**どのインスタンス** にアクセスできるかを制御します。**リソースタグ** で制限できます（例：`environment = dev` のインスタンスのみ接続許可）。ユーザーには SSM 権限（例：`ssm:StartSession`）が必要です。S3 や CloudWatch にログを送る場合は、ポリシーでその書き込みも許可します。オプションで、セッション内で **実行可能なコマンドを制限** してセキュリティを高められます。
- **セキュリティ（試験向け）：** **SSH** では通常 **インバウンド 22**（またはバストン）を開き、キーや IP でアクセスします。**Session Manager** ではインスタンスに **インバウンドルールは不要** で、**SSM エージェント**、**インスタンスの IAM ロール**（例：AmazonSSMManagedInstanceCore）、**Session Manager の IAM 権限を持つユーザー** があれば十分です。セッションデータはすべて S3 または CloudWatch にログできます。

**Session Manager（コンソールと設定）**

- 左メニューの **Session Manager** から管理インスタンスを選び **Start session** すると、そのインスタンスのセキュリティグループに **SSH インバウンドルールがなくても** 対話シェル（`echo`、`ls`、`sudo`、パッケージインストールなど）が使えます。**セッション全体** が Session Manager でログされます。セッション終了後、Session Manager の **Session history** で記録を確認できます。
- **Preferences**（Session Manager で編集）：**Idle timeout**；セッションデータの **KMS 暗号化**；**特定ユーザーでセッションを実行**（例：Linux では `ec2-user`）；**CloudWatch ログ**（全セッションを CloudWatch Logs へ）；**S3 ログ**（セッションログを S3 へ）；**Linux シェルプロファイル** と **Windows シェルプロファイル**。多くの組織は EC2 アクセスに SSH の代わりに Session Manager を使い、集中ログとインバウンドポートを開けない運用でコンプライアンスを高めています。

## SSM Automation（runbooks）

- **Automation** は EC2 やその他 AWS リソースの **メンテナンスとデプロイ** を簡略化します。Run Command（エージェント経由で **インスタンス内** で実行）と違い、**Automation は外から** 実行され、AWS API（インスタンスの停止/起動、AMI 作成、EBS スナップショット、ASG 更新など）を呼びます。
- **Runbooks：** Automation の **ドキュメント** を **runbooks** と呼びます。**Amazon 提供**（例：`AWS-RestartEC2Instance`）または **カスタム** があります。インスタンス管理、パッチ、リメディエーション、バックアップ、コスト管理などのカテゴリがあります。
- **トリガー：** 手動（コンソール、CLI、SDK）、**スケジュール**（例：**Maintenance Window**）、**EventBridge**（ルールのターゲット = SSM Automation）、**AWS Config リメディエーション**（リソースが非準拠のときに実行）で実行できます。
- **実行オプション：** シンプル（全ターゲット）、**レート制御**（例：1 台ずつ）、**マルチアカウント・マルチリージョン**、**手動ステップ**（ステップ間の承認）が選べます。Automation 用の **IAM ロール** を指定できます。レート制御とエラーしきい値は Run Command と同様です。
- **例：** `AWS-RestartEC2Instance` をレート制御で実行、ターゲット = リソースグループ（例：Dev グループ）。ステップ：インスタンスを停止し、その後起動。SSH やカスタムスクリプトは不要で、フリートの安全な再起動に使えます。

## 例：パッチ済み AMI と ASG リフレッシュ（Automation フロー）

よくあるパターン：**ASG** が **古い AMI** でインスタンスを起動しているとき、**AMI にパッチを当て**、ASG が新しい AMI を使うようにしてからインスタンスをリフレッシュします。

1. **Automation**（インスタンス作成・コマンド実行・AMI 作成・ASG 更新ができる IAM ロールで）：  
   - **ソース AMI** から EC2 インスタンスを **起動**。  
   - そのインスタンスで **Run Command** を実行し、**AWS-RunPatchBaseline**（SSM ドキュメント）でパッチをインストール。  
   - インスタンスを **停止** し、そこから **AMI を作成** してからインスタンスを **終了**。**パッチ済み AMI** が得られます。  
2. **ASG を更新** して新しい AMI を使う：同じ Automation 内で **スクリプト**（例：Python）を実行し、** launch template** を新しい AMI ID で **更新**、**ASG** がその launch template を使うように **更新**。ASG が起動する新インスタンスはパッチ済み AMI を使います。  
3. **既存インスタンスの置き換え：** ASG 内の既存インスタンスはまだ古い AMI のままです。**EC2 Instance Refresh**（ASG の機能）— **Automation から開始可能** — で、新しい launch template のインスタンスに置き換えます。  

すべてが **単一の SSM Automation** でオーケストレートされ、手動ステップはなく、複数の AWS API（EC2、SSM Run Command、ASG、launch template）と連携します。

## Parameter Store

- **目的：** **設定** と **シークレット** を安全に保存するサーバーレスストア。**KMS**（SecureString）で暗号化可能。**バージョン追跡** 付き。**IAM** でアクセス制御。**EventBridge**（一部で通知）や **CloudFormation**（スタック入力としてパラメータ）と連携。
- **タイプ：** **String**（平文、Standard は 4 KB / Advanced は 8 KB まで）、**StringList**、**SecureString**（KMS で暗号化 — 自前の CMK またはデフォルトの `alias/aws/ssm`）。アプリはパラメータの **読み取り** IAM 権限と（SecureString の）**復号** KMS 権限が必要です。
- **階層：** **パス** で整理（例：`/my-app/dev/db-url`、`/my-app/dev/db-password`）。**IAM ポリシー** を簡略化できます（パス単位で付与、例：アプリ全体やアプリ＋環境）。コンソールでは階層で一覧表示されます。
- **Secrets Manager：** Parameter Store から Secrets Manager のシークレットを **参照**（参照構文）できます。**パブリックパラメータ** は AWS が提供（例：リージョンごとの最新 Amazon Linux 2 AMI ID）し、Parameter Store API で利用可能です。
- **ティア：**
  - **Standard：** 無料。**10,000** パラメータまで、値 **4 KB** まで。**parameter policies** なし。他アカウントとの共有不可。
  - **Advanced：** **1 パラメータあたり $0.05/月**。**100,000** パラメータまで、値 **8 KB** まで。**parameter policies** 利用可。他アカウントと共有可。
- **Parameter policies（Advanced のみ）：** ローテーション／更新を強制または促すポリシーを付与：
  - **Expiration（TTL）：** 指定時刻までにパラメータを削除または更新。機密データ（パスワードなど）の陳腐化防止に。**EventBridge** で期限の **15 日前** などに通知を受けられます。
  - **No-change notification：** パラメータが X 日間更新されていない場合に EventBridge で通知（定期的なローテーションの強制など）。1 パラメータに複数ポリシーを付与可能です。
- **CLI：** `aws ssm get-parameters --names "/my-app/dev/db-url" "/my-app/dev/db-password"` で値を取得；SecureString の復号には `--with-decryption`（KMS 権限必要）。`aws ssm get-parameters-by-path --path "/my-app/dev"` でそのパス以下の全パラメータ；`--recursive` でネストしたパスも（例：`/my-app` に `--recursive` で dev と prod）。**バージョン履歴** はコンソールで各パラメータごとに確認できます。

## Inventory

- **目的：** **管理インスタンス**（EC2 とオンプレ）から **メタデータ** を収集します。インストール済みソフト、OS 情報、ドライバ、設定、適用済み更新、実行中サービス。各ノードの **インベントリ** を検索可能にします。
- **表示・分析：** **SSM コンソール** で表示（インスタンスタイプ別カバレッジ、主要 OS バージョン、主要アプリなど）。**Resource Data Sync** で **インベントリデータを S3 に同期** し、**Athena**（サーバーレス SQL）でクエリ、**QuickSight** でダッシュボード作成が可能です。
- **収集：** **メタデータ収集間隔**（分・時間・日）を設定します。複数アカウントのインベントリを **1 アカウントに集約** して中央でクエリできます。**カスタムインベントリ** タイプ（例：インスタンスごとのレプリケーション状態）を定義できます。
- **有効化の仕組み：** **Inventory** ページで「inventory on all instances」を有効にすると、インスタンスを「gather software inventory」状態にする **State Manager のアソシエーション** が作成されます。ターゲットは管理インスタンス ID；**State Manager** がアソシエーションを実行し、インスタンスごとに成功/保留をレポートします。実行後、インスタンスは「inventory enabled」となり、要約（OS、アプリなど）と詳細データを確認できます。
- **Resource Data Sync（ハンズオン）：** **Resource Data Sync**（例：「DemoSync」）を作成し、SSM がインベントリデータを書き込む **S3 バケット** を指定します。バケットには SSM サービスが `PutObject`（および必要なプレフィックス）できる **バケットポリシー** が必要です。コンソールの例でバケット名とアカウント ID を置き換えてください。同期作成後、データは S3 に書き込まれ、Inventory ページから **Athena** で **高度なクエリ**（例：**AWS:Application** などのインベントリタイプ — 名前、バージョン、アーキテクチャ、発行元など）を実行できます。初回同期は反映に数分かかることがあります。

## State Manager

- **目的：** 管理インスタンスを **定義した状態** に保つことを **自動化** します。**アソシエーション** を作成します：望ましい状態を記述する SSM **ドキュメント** と、ターゲット（インスタンス ID、タグ、リソースグループ）に適用する **スケジュール**（例：24 時間ごと）です。
- **用途：** ソフトウェアの **ブートストラップ**（例：CloudWatch エージェントのインストール）；スケジュールでの **OS・アプリのパッチ**；設定の強制（例：「ポート 22 は閉じる」「アンチウイルスをインストールする」）。**Inventory** は、状態が「gather software inventory」の State Manager アソシエーションとして実装されています。
- **仕組み：** SSM **ドキュメント**（例：CloudWatch エージェント用 AWS-ConfigureAWSPackage や組み込みインベントリドキュメント）を選び、**ターゲット**（インスタンスまたはグループ）と **スケジュール** を設定します。State Manager がスケジュールでドキュメントを実行し、インスタンスごとに **アソシエーションステータス** と **実行履歴**（成功、保留、失敗）をレポートします。インスタンスがドリフト（例：誰かがソフトをアンインストール）しても、次回実行で望ましい状態に戻せます。
- **試験向け：** State Manager = **望ましい状態** + **スケジュール** + **SSM ドキュメント**。アソシエーションが継続的な設定と Inventory などの機能をフリートで有効にする仕組みです。

## Distributor

- **目的：** **管理インスタンス**（EC2、オンプレ）に **ソフトウェアをパッケージしてデプロイ** します。**Distributor パッケージ**（SSM ドキュメント）を作成し、**プラットフォーム**（Windows、Linux など）ごとにデプロイします。
- **パッケージ内容（S3）：** 内容は **Amazon S3** に格納します。**ターゲット OS ごとに 1 つの zip**（例：Linux 用 1 つ、Windows 用 1 つ）を用意します。各 zip には **インストールスクリプト**、**アンインストールスクリプト**、**実行ファイル**、パッケージを記述する **JSON マニフェスト** が含まれます。**自作パッケージ**、**AWS 提供**、**サードパーティ** のパッケージで、インスタンスに定期的にソフトをインストール・更新できます。
- **インストール方法：** **(1) Run Command** — 1 回限り：選択したインスタンスに Distributor パッケージをインストールするコマンドを実行。**(2) State Manager** — スケジュール：**AWS-ConfigureAWSPackage** ドキュメントでインスタンスが Distributor から **定期的に** パッケージを受け取る（望ましい状態 = パッケージがインストール/更新されている）。State Manager がパッケージを維持し、誰かがアンインストールした場合などのドリフトを修復できます。

## Patch Manager

- **目的：** 管理インスタンスの **パッチを自動化** します。**OS 更新**、**アプリ更新**、**セキュリティ更新**。**EC2** と **オンプレ**、**Linux**、**macOS**、**Windows** をサポートします。**オンデマンド** または **Maintenance Window** による **スケジュール** で実行します。
- **フロー：** Patch Manager がインスタンスを **スキャン** し、**パッチコンプライアンスレポート**（不足/インストール済みパッチ）を生成します。レポートは **S3** に送って監査やオートメーションに使えます。パッチ適用（スキャン＋インストール）は **AWS-RunPatchBaseline** ドキュメントで行い、コンソール、SDK、Maintenance Window から実行できます。各インスタンスの **SSM エージェント** が **Patch Manager** に問い合わせ、そのインスタンスに割り当てられた **patch baseline** に基づいてインストールするパッチを決めます。**レート制御**（例：Maintenance Window 経由）が利用可能です。
- **二つの主要概念：** **(1) Patch baseline** — **(2) Patch groups。**

**Patch baseline**

- インスタンスに **どのパッチをインストール可能/必須とするか**（および拒否するか）を定義します。**事前定義** ベースラインは AWS が OS ごとに提供し、**AWS が管理** して **変更不可** です。**デフォルト** では **クリティカルとセキュリティ** のパッチのみをインストールします。
- **カスタム patch baseline：** 自分でベースラインを作成し、**承認**／**拒否** パッチ、リリースから X 日以内の **自動承認**、**OS** を指定します。**カスタムまたは代替のパッチリポジトリ**（社内リポジトリなど）も指定できます。patch group に属さないインスタンス用に **デフォルト** のベースラインを 1 つ設定できます。
- パッチを **適用** するには SSM ドキュメント **AWS-RunPatchBaseline** を実行します。**OS** と **アプリケーション** のパッチ（Linux、macOS、Windows Server）の両方を適用します。

**Patch groups**

- **Patch groups** は **インスタンスの集合** を **特定の patch baseline** に関連付けます。ベースラインが複数（例：dev と prod）で、インスタンスごとに異なるパッチセットを当てたいときに使います。
- インスタンスにタグキー **`Patch Group`**（または設定したキー）と値（例：`dev`、`prod`、`test`）を付けます。1 インスタンスは **1 つの** patch group にのみ属します。各 **patch group** は **1 つの** patch baseline に **登録** されます。
- **デフォルトベースライン：** **patch group タグのない** インスタンスは **デフォルト** の patch baseline を使います。**AWS-RunPatchBaseline**（Run Command や Maintenance Window 経由）を実行すると、各インスタンスのエージェントが Patch Manager にどのベースラインを適用するか問い合わせ、Patch Manager がインスタンスの **Patch Group** タグ（またはデフォルト）に基づいて適用するパッチ一覧を返します。

**Patch policy（コンソール）**

- Patch Manager で **patch policy** を作成し、スキャンおよび/またはインストールを自動化できます。**ポリシー名**（例：DemoPolicy）。**Scan only**（不足を確認）または **scan and install**。scan and install の場合：**スキャンスケジュール**（例：毎日 1:00）と **インストールスケジュール**（例：毎週日曜）を設定；必要なら **reboot**。OS ごとに **patch baseline** を選択：**推奨デフォルト**（全サポート OS 向け AWS 定義）または **カスタムベースライン**（OS ごとに 1 つ）。オプションで **パッチログを S3 に書き出し**。**ターゲット：** 現在のリージョンまたは **全リージョン**（1 ポリシーでマルチリージョン）。**デプロイターゲット：** 全管理ノードまたは特定インスタンス。**レート制御**（例：10% ずつ）と **エラーしきい値**（失敗が多すぎたら停止）。**IAM：** パッチ適用用のインスタンスプロファイル/ロール。ポリシーを作成して適用します。
- **Patch Manager 概要 UI：** インスタンス管理、**コンプライアンス**、レポートのダッシュボード；**ノードのパッチ詳細**；OS ごとの **patch baselines**（表示、**承認ルール** と **例外** 付きカスタム作成）；**patches** 一覧（OS、リリース日、重要度）；**設定**（Security Hub 連携など）；左に **Maintenance Windows** へのリンク。

## Maintenance Windows

- **目的：** SSM が登録インスタンスで **タスク** を実行する **スケジュール**（と期間）を定義します。例：**OS パッチ**、**ドライバ更新**、**ソフトウェアインストール** を、例として 3:00–5:00 のような **メンテナンス枠** で行います。
- **内容：** Maintenance Window には **スケジュール**（cron または rate）、**期間**（枠が開いている長さ）、**登録ターゲット**（インスタンス、ID/タグ/リソースグループで指定）、**タスク**（例：**AWS-RunPatchBaseline** を使う Run Command や Automation）があります。**レート制御** で枠内で一度にパッチするターゲットを一部に限定できます。
- **Maintenance Window の作成（コンソール）：** **名前**（例：DemoMaintenanceWindow）で作成。**未登録ターゲットを許可** するオプション。**スケジュール：** cron（例：毎日 3:00）または rate。**期間**（例：2 時間）。枠終了 **X 時間前** に **新規タスクの開始を止める** オプション（例：1 時間）。開始・終了時刻の指定も可能。作成後、枠内に **タスクを登録** — 例：**Run Command**、ドキュメント **AWS-RunPatchBaseline**、タスク名（例：「patch」）、**ターゲット** を選択。**同時実行数**（例：1 台ずつ）と **エラーしきい値**（例：0 で最初の失敗で停止）を設定。パッチは枠の間だけ実行されます。Maintenance Window は削除してクリーンアップできます。
- **試験向け：** Patch Manager でインスタンスを **パッチ** する；パッチは **Maintenance Window 内** で **レート制御** してフリート全体を一度に巻き込まないように実行できます。

## OpsCenter

- **目的：** **問題の確認・調査・リメディエーションを一箇所で** 行います。運用上の問題を Systems Manager に **集約** し、**平均解決時間（MTTR）** を短縮します。**EC2** と **オンプレ** の管理ノードをサポートします。
- **取り込み元：** **CloudWatch**、**Application Insights**、**EventBridge**、**Config**、**Security Hub**、**DevOps Guru**、**SSM Incident Manager** からデータが **集約** されます。例：**セキュリティの所見**（Security Hub）、**パフォーマンス問題**（DynamoDB スロットリングなど）、**失敗**（ASG からインスタンスの起動に失敗など）。
- **OpsItems：** **OpsItem** は調査とリメディエーションが必要な運用上の問題や障害です。**イベント**、**リソース**、**設定変更**、**CloudTrail** ログ、**EventBridge** などから作成できます。OpsCenter で全 OpsItems を確認し、**推奨** — どの **runbooks** と **SSM Automations** が解決に役立つか — を得られます。
- **通知とオートメーション：** OpsItems まわりで **通知** と **オートメーション** を設定できます。例：**EventBridge**（例：毎日）が **Lambda** を起動し、EC2 で **孤立した EBS ボリューム**（未アタッチや 45 日以上未使用など）をスキャンして OpsCenter に **OpsItems を作成**。OpsCenter の推奨には、**スナップショット作成**、**スナップショット削除**、**ボリューム削除** の SSM ドキュメント実行が含まれ、**SSM Automations** として実行されます。

## Features（参照）

Systems Manager の機能は多く、試験に関連する領域は次のとおりです。

- **ノード／フリート：** Fleet Manager、Compliance、Inventory、Hybrid Activations、**Session Manager**、**Run Command**、**State Manager**、**Patch Manager**、Distributor  
- **変更管理：** **Automation**、Change Calendar、**Maintenance Windows**、**Documents**、Quick Setup  
- **アプリケーション：** Application Manager、AppConfig、**Parameter Store**  
- **オペレーション：** Explorer、OpsCenter、CloudWatch ダッシュボード  

---
> 🌐 *Claudeによる翻訳*
