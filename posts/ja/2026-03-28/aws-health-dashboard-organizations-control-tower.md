---
title: "AWS アカウント管理：Health ダッシュボード、Organizations、SCP、Control Tower"
date: "2026-03-28"
excerpt: "CloudOps メモ：AWS Health（サービス／アカウント／組織ビュー、EventBridge 自動化）、AWS Organizations（OU、一括請求、SCP、RI 共有、PrincipalOrgID）、Control Tower のランディングゾーンとガードレール。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["aws", "health", "organizations", "scp", "control-tower", "multi-account", "billing", "sysops", "cloudops", "certification"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 10
collectionTitle: "AWS CloudOps Engineer - Associate"
---

**SysOps** / **CloudOps** 向けの要点：**AWS Health** がインシデントをどう見せるか、**Organizations** がアカウントをどう束ね **SCP** がどう制限するか、**Control Tower** が統制されたマルチアカウント環境をどう立ち上げるか。コースでは **Billing**（一括請求先、コストツール）を組織の **management アカウント**とセットで扱います。請求書と配賦には請求側の **Billing コンソール**を使う一方、以下は主に Health、Organizations、Control Tower です。**Service Catalog**、**CloudWatch 請求アラーム**、**Budgets**、**Cost Explorer**、**コスト配分タグ**、**CUR**、**Compute Optimizer**、**Billing Conductor** については **[AWS Service Catalog, Billing Alarms, Cost Explorer, Budgets, and Cost Tools](/ja/posts/aws-service-catalog-billing-cost-management)** を参照。

## AWS Health ダッシュボード（二面）

### サービスヘルス（公開／「Service History」）

- 旧称 **AWS Service Health Dashboard** — 時系列の **リージョン** × **サービス** ステータス、**RSS**、多数の顧客に影響する **オープン** なグローバル障害。
- **一般的**な可用性の絵で、**あなたの**リソース専用ではない。

### アカウントヘルス（パーソナライズ）

- 旧称 **Personal Health Dashboard (PHD)**。現在はコンソールの **Health**（**ベル** → **Event log** / Health）。
- **オープン**／**最近**の問題、**スケジュールされた変更**（例：**EBS** メンテ）、**影響を受けるリソース**、**修復**のヒント、実際に使うリソースに**触れる**問題の**イベントログ**（発生／解消時刻）。
- **グローバル**な体験：公開のサービスヘルスが広く見えても、**あなたの**利用（例：**us-east-2** の **EC2**）に関係するインシデントを表示。

### 組織ヘルス

- **AWS Organization** 内の**すべてのアカウント**にわたる **Health** の集約ビュー（組織コンテキストで設定）。
- その上に **EventBridge** で自動化（下記）。

## AWS Health → EventBridge

**AWS Health** は **EventBridge** ルールでマッチさせ、**SNS**、**Lambda**、**SQS**、**Kinesis** などに送れます。

- **アカウント固有**のイベント（利用リソース）と、必要なら**パブリック**なサービスイベント。
- **ユースケース：** **EC2** の**プラットフォーム更新**が予定されたらメール；「**IAM キー露出**」系の検知でキーを**無効化**する **Lambda**；**リタイア予定**インスタンス向けの **EC2 再起動**など**ターゲット**で、強制停止を待たずに回復。

**注：** 他の AWS コントロールプレーン連携と同様、オーケストレーションは**非同期**とみなし、**リトライ**と**冪等性**を設計する。

## AWS Organizations

**複数アカウント**を一つの **organization** にまとめる**グローバル**サービス。

- **Management アカウント**（請求／「マスター」）— **一括請求**（**一つ**の支払方法で**全**メンバー支払い）。**メンバー**は**招待**で参加（子で承認；招待は**期限切れ**になり得る — コースでは**約 2 週間**）か、組織が**作成**（メール + **OrganizationAccountAccessRole** 型の **IAM ロール**名）。
- AWS アカウントは同時に**一つ**の organization にしか属さない。
- **料金上の利点：** **集約**利用量で**ボリューム**割引（**EC2**、**S3** など）；**Reserved Instance** と **Savings Plans** の割引は**共有**が**両方**（または関係アカウントすべて）で**有効**なときに**横断**で使える — 請求アカウントを含め**共有オフ**で**コミットメント効果**を**分離**できる。

### 組織単位（OU）

- **ルート** OU に **management** アカウント。ネストした OU（**dev** / **test** / **prod**、**事業部**、**プロジェクト**など）を作成。
- **SCP** と運用境界に合わせてメンバーアカウントを**移動**。**ベストプラクティス：** 強い理由がなければ **management** は**ルート**に置く。

### マルチアカウントの理由（1 アカウント多 VPC との比較）

- VPC だけより**ブラスト半径**の分離が強い。
- **コスト配賦**の**タグ**標準；**組織全体の CloudTrail** を**中央 S3** バケットへ；**CloudWatch Logs** の**中央ログ**アカウント；**management** からの **break-glass** / 自動化用**クロスアカウント IAM ロール**。

### 一括請求（SysOps 視点）

- **料金**は **management** に集約。**Billing** と **Cost Management** で**請求書**、**予算**、**配賦**（タグ、**CUR** など）。

## サービスコントロールポリシー（SCP）

**SCP** は **ルート**、**OU**、**アカウント**に付く**組織**ポリシー。**メンバー**アカウントの **IAM プリンシパル**が**これ以上**持てない権限の**上限**を**制限**する — 単体では権限を**付与しない**。

- **Management は除外** — **SCP** は **management** を**制限しない**（組織ロックアウト防止）。
- メンバーでの実効アクセス = **アイデンティティポリシー**と OU パス上**継承したすべての SCP** の**積**；スコープ内の**明示的 `Deny`** が**勝つ**。
- 通常は上位に **`FullAWSAccess`**（全サービス許可）を付け、**`Deny` SCP** を足す（または列挙だけ許可する**許可リスト SCP** — ずっと厳しい）。
- **実演効果：** OU に **Deny S3** すると **メンバー**の**アカウント root** でも **S3** が**ブロック**される。

### SCP パターン（試験風）

- **`aws:RequestTag/department` が存在**しない限り **`ec2:RunInstances` を Deny**（**起動時タグ**強制）。
- **`business-unit` タグが `infra-` で始まら**ない限り **`RunInstances` を Deny**（存在だけでなく**形**）。
- **`deployment-type` タグが `in-region` か `edge` のみ**など、**列挙**のみ許可する **`RunInstances` Deny**。
- **リージョン許可リスト：** `*/*` に対する **`Deny *`** と **`aws:RequestedRegion`** の **`StringNotEquals`** で **`eu-central-1`**、**`eu-west-1`** など**以外**を**拒否**。

### その他の組織ポリシー種別（把握）

- **Backup policies** — 組織単位の **AWS Backup** プラン。
- **Tag policies** — **監査**と**コスト配賦**のため **タグキー／値**を標準化；**非準拠**リソースの一覧；タグ準拠シグナルで **EventBridge** から反応。

### `aws:PrincipalOrgID`

**リソースポリシー**（例：**S3** バケット）で、**すべての account ID** を列挙せず組織内**任意アカウント**のプリンシパルを**許可**できる。

## AWS Control Tower

**Organizations** の上の、意見がはっきりした**ランディングゾーン**：**マルチアカウント**構成、**ガードレール**、**ダッシュボード**を手配線ほぼなしで。

- **ランディングゾーン**ウィザード：**ホームリージョン**、未承認リージョン向けオプションの **Region deny**、**ガバナンス**対象の**追加リージョン**。
- **OU** を作成（コースデモ：**Security** + **Sandbox**；構築後は **Core** / **Custom** と **audit** / **log archive** が **Core** 下、などの表示）。
- **専用アカウント：** **Log archive**（不変に近いログ）、**Audit**（セキュリティツール）、**management** / ワークロードの型 — アカウントごとに**メール**が必要。
- **アカウントアクセス：** 登録済み**すべて**に**一つの**ポータルから入るデフォルトは **IAM Identity Center**（**SSO** の後継）；**自己管理**は可能だが重い。
- **ランディングゾーン**で **CloudTrail** 有効；オプションで **S3** 配信と **KMS** 暗号化。
- **ガードレール：** **予防**（**SCP** — 例：log archive **削除禁止**、ログバケット**公開読取禁止**、**CloudTrail** **無効化禁止**）と**検知**（多くは **Config** ルール）。コースではデフォルト束に**約 20 予防**と**約 2 検知** — 数は変わり得る。
- **運用の目安：** 登録後、**Control Tower** フロー（**Account Factory**、**OU** 登録）で**ガバナンス下**に置きたいアカウント・構造を扱う；そのリソースを生の **Organizations** と**争わない**。
- **コスト／時間：** プロビジョニングは**遅い**（コース：**約 60 分**）かつ**有料** — 個人アカウントでフル構築は**避ける**かコストを受け入れる。

## 要点

- **Service Health** = 広い **リージョン／サービス**の時系列；**Account Health** = **あなたの**リソース、**影響資産**、**メンテ**、**修復**；**Org Health** = 集約ビュー；**ベル** / **Event log**。
- **Health → EventBridge** で **SNS** アラート、**Lambda** 修復、**EC2** アクションなど、**計画**作業と**リスク**イベント向け。
- **Organizations** = **グローバル**、**アカウントあたり 1 org**、**management** 請求、**一括請求**、**ボリューム**割引と **RI** / **Savings Plans** **共有**（アカウントごとの**共有**トグル）、ネスト **OU**、**組織トレイル** / **中央ログ**。
- **SCP** は**メンバー**のみ制約；**`Deny`** と**許可リスト**が強力；**タグ**と**リージョン**条件は試験でよく出る；**`aws:PrincipalOrgID`** が**リソース**ポリシーでの**クロスアカウント信頼**を簡素化。
- **Control Tower** = **ランディングゾーン** + **ガードレール**（**SCP** + **Config**）+ **Identity Center** ポータル + **Security/Audit/Log** アカウント；**高コスト**で**時間がかかる** — **何が作られるか**を知ることが、prod でのクリックだけより重要。

---
> 🌐 *Claudeによる翻訳*
