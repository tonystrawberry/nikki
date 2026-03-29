---
title: "AWS のセキュリティ、コンプライアンス、暗号化、シークレット（CloudOps 向け）"
date: "2026-03-29"
excerpt: "CloudOps 試験メモ：WAF、Shield、Firewall Manager、Inspector、Athena とのログ、GuardDuty、Macie、Trusted Advisor、Security Hub、Audit Manager、KMS（ローテーション、MRK、削除）、ACM、Secrets Manager と Parameter Store の比較。"
author: "Tony Duong"
category: "note"
tags: ["aws", "waf", "shield", "firewall-manager", "kms", "acm", "tls", "secrets-manager", "security-hub", "guardduty", "inspector", "macie", "cloudops", "certification", "compliance", "encryption"]
collection: "aws-cloudops-engineer-associate"
collectionOrder: 13
collectionTitle: "AWS CloudOps Engineer - Associate"
---

**SysOps / CloudOps** 認定向けにまとめた **セキュリティとコンプライアンス**：**境界** コントロール（**WAF**、**Shield**、**Firewall Manager**）、**脆弱性** と **データプライバシー** サービス、**一元化** されたセキュリティ姿勢（**Security Hub**、**GuardDuty**、**Trusted Advisor**、**Audit Manager**）、**ログ → S3 → Athena** のパターン、暗号化基盤（**KMS**、**ACM**）と **Secrets Manager** 対 **Systems Manager Parameter Store**。

**災害復旧** のデータ移動とバックアップは **[AWS DataSync and AWS Backup: Disaster Recovery Notes](/ja/posts/aws-datasync-and-backup-disaster-recovery-notes)** を参照。

## AWS WAF（Web Application Firewall）

- **レイヤー 7（HTTP/HTTPS）** の保護 — **レイヤー 4（TCP/UDP）** の **NLB** とは対比；試験では **WAF は NLB にアタッチしない**。
- **アタッチ先：** **Application Load Balancer**、**API Gateway**、**CloudFront**、**AppSync** GraphQL API、**Cognito** ユーザープール。
- **Web ACL** に **ルール**；**ルールグループ**で再利用可能なルールを束ねる。**IP セット**はセットあたり最大 **10,000** アドレス（複数ルール／セットで拡張）。
- コースで触れるルール種別：**IP** の許可／拒否、**HTTP ヘッダー** と **ボディ**、**URI** 文字列（例：**SQL インジェクション**、**XSS** パターン）、**サイズ制約**、**geo match**（国の許可／ブロック）、**レートベース** ルール（例：**DDoS** 的乱用のため IP あたりのリクエスト上限）。
- リージョンリソース向けは **リージョン** Web ACL；**CloudFront** は **us-east-1**（バージニア北部）で作成する **グローバル** Web ACL。
- **試験のアーキテクチャ：** **WAF** + **静的 IP** → **Global Accelerator**（Anycast 静的 IP）の前に **ALB**、**WAF** は **ALB** に（アプリと同じリージョン）。

## AWS Shield と AWS Firewall Manager

### Shield

- **Shield Standard：** **無料**、全顧客向けにオン；一般的な **L3/L4** 攻撃（**SYN/UDP** フラッド、反射攻撃など）を緩和。
- **Shield Advanced：** 任意の**有償**ティア（コースでは組織あたり **約 3,000 ドル/月** 規模 — 料金確認）；**EC2**、**ELB**、**CloudFront**、**Global Accelerator**、**Route 53** への **DDoS** 緩和を拡大；**24/7 DDoS 対応チーム（DRT）**；攻撃時のスケールアウトに対する **コスト保護**；**L7** 向けの**自動アプリケーション層**緩和で **WAF** ルールを**作成・調整**する場合あり。

### Firewall Manager

- **メンバーアカウント**横断の **組織レベル** セキュリティポリシー：**WAF** ルール、**Shield Advanced** 設定、**EC2/ALB/ENI** の **セキュリティグループ** ベースライン、**Network Firewall**、**Route 53 Resolver DNS Firewall**。
- ポリシーは**リージョンごと**に定義され **組織** に複製；**新しい** リソース（例：新しい **ALB**）に**自動**でポリシーを適用できる — **単一アカウント** の **WAF** だけの場合との**差別化**。
- **位置づけ：** **単発**／**単一アカウント** は **WAF** のみ；**複数アカウント** で **WAF**（および他ファイアウォール）を **標準化・自動化** するには **Firewall Manager**；**組織** 全体への **Shield Advanced** 展開にも **Firewall Manager** が使える。
- コンソールデモでは **Firewall Manager** の**ポリシーごとの月額**に触れることが多い — ラボでは個人アカウントで **Subscribe** しない。

### 組み合わせ

**WAF** + **Shield Advanced** + **Firewall Manager** は**補完関係**：**WAF** で ACL を定義し、**Firewall Manager** で **マルチアカウント** の一貫性を**オーケストレーション**、**DRT**・**コスト保護**・攻撃下での **L7** **WAF** 自動調整が必要なら **Shield Advanced** を追加。

## Amazon Inspector

- **EC2**（**SSM** エージェント経由 — インスタンスは **Systems Manager** で**管理**）、**ECR** へプッシュした**コンテナイメージ**、デプロイ時の **Lambda** の **CVE**／依存関係の**継続**評価；**EC2** の**ネットワーク到達性**分析。
- 結果は **Security Hub** と **EventBridge** へ；**リスクスコア**で優先度付け。
- **料金／トライアル：** リソース課金やトライアルに言及 — ラボ終了後は**無効化**。

## Amazon Macie

- **S3** 内の**機微データ**（例：**PII**）を **ML** とパターンマッチングで発見する**フルマネージド** サービス。
- アラートは **EventBridge** → **SNS**、**Lambda** など。コースでは **Macie** をこのセクションでは **S3** 中心に。

## 監査ログと分析

よく使うセキュリティ／監査ログのソース：

| ソース | 役割（概要） |
|--------|-------------------|
| **CloudTrail** | **API** とコンソールの **監査** |
| **AWS Config** | 時系列の **設定** と **コンプライアンス** |
| **CloudWatch Logs** | アプリ／サービス **ログ**、保持 |
| **VPC Flow Logs** | VPC 内 **IP トラフィック** の可視化 |
| **ELB access logs** | ロードバランサ経由リクエストの **メタデータ** |
| **CloudFront** logs | ディストリビューションへのビューリクエスト |
| **WAF** logs | **WAF** が評価したリクエスト |

**試験の型：** ログを **S3** に置き **Athena** で分析（例：**EC2** がなくなったあと **ELB** アクセスを調査）。ログバケットを強化：**暗号化**、**IAM ／バケットポリシー**、**MFA**；コンプライアンスで **イミュータビリティ** が必要なら **Glacier**／**S3 Object Lock**／**Vault Lock** 型の長期保持。

## Amazon GuardDuty

- **ML**、**異常検知**、**脅威インテリジェンス** による**脅威検出**；**エージェント不要**；コースでは **30 日** トライアル。
- **主なデータソース：** **CloudTrail**（通常と異なる **管理** および **S3 データプレーン** API を含む）、**VPC Flow Logs**、**Route 53 Resolver** の **DNS ログ**（例：侵害を示唆する不審または**エンコード**されたクエリ）。
- **任意**のデータソース（コース・製品リストは要確認）：**EKS** 監査ログ、**RDS/Aurora** ログイン活動、**EBS**、**Lambda** ネットワーク活動、**S3** データイベント、**ランタイム** 監視など。
- **Findings** → **EventBridge** → **Lambda**、**SNS** など。
- **仮想通貨マイニング** 活動は試験で**専用の finding ファミリー**として触れられる。

## AWS Trusted Advisor

- **インストール不要**；**コスト最適化**、**パフォーマンス**、**セキュリティ**、**耐障害性**、**サービス制限**、**運用の卓越性** の**高レベルチェック**（例：**EBS/RDS** のパブリックスナップショット、**IAM** 衛生）。
- **無料** ティア vs **Business/Enterprise** サポートで**全チェック** と **AWS Support API**。
- 連携：**Security Hub**、**Config**、**Compute Optimizer**；**サービス制限** 使用量などのメトリクスで **CloudWatch** アラーム → **SNS**。
- **Organizations：** **全機能** かつ対象の **サポート** プランがあるとき、**管理アカウント** から **Trusted Advisor** の**集約ビュー**；**trusted access**／**委任管理者** をドキュメントどおり有効化。

## AWS Security Hub

- **一元** セキュリティ姿勢ダッシュボード；**GuardDuty**、**Inspector**、**Macie**、**IAM Access Analyzer**、**Systems Manager**、**Firewall Manager**、**Health**、**Config**、**パートナー** 製品の findings を**集約**。
- **Security Hub** の **設定駆動** チェックには **AWS Config** の**有効化**が**前提**。
- **セキュリティ標準**（例：**CIS AWS Foundations**）と**自動チェック**；findings を **EventBridge** へ；調査と根本原因分析に **Amazon Detective**。
- **マルチアカウント：** **Organizations** と統合；**委任 Security Hub 管理者** でメンバー横断の設定（例：**CIS** の一括実行）を**任意**で。
- **料金：** チェックごと・finding **取り込み** 課金；コースでは **10,000** 件までの finding イベント **無料枠** と **30 日** トライアル — 最新料金を確認。

## AWS Audit Manager

- **GDPR**、**HIPAA**、**PCI DSS**、**SOC 2** などのフレームワークに対する**継続的**な **リスク** と **コンプライアンス** 評価。
- **フレームワーク** を選び、**スコープ**（アカウント、リージョン、サービス）を定義し、**証拠フォルダ** に**自動収集**された証拠を集め、**コントロールレビュー**（委任可）、**是正** を追跡し、**監査向け** レポートをエクスポート。

## AWS KMS（Key Management Service）

### 基本

- **IAM** と統合された**認可**；キーの**毎回の利用**は **CloudTrail** で**監査**可能（試験でよく出る）。
- **対称鍵：** 暗号化と復号に同じ鍵材料；生の鍵バイトは**エクスポートしない** — **KMS API** のみ。ほとんどの **AWS サービス** 連携のデフォルト。
- **非対称鍵：** 公開**暗号化**／秘密**復号**（または**署名／検証**）；**公開鍵**は **KMS** を呼べない **AWS 外** のクライアントに配布可能；**秘密鍵**の利用は API のみ。

### キーの種類

| 種類 | メモ |
|------|--------|
| **AWS owned** | 無料；内部利用（デフォルト **SSE-S3**／**DynamoDB** サーバーサイド暗号化の話など）。 |
| **AWS managed** | 無料；**`aws/<service>`** 形式の **`alias`**；**キーポリシー** は多くの場合 **ViaService** で所有サービスに制限（例：**EBS** の **EC2**）。 |
| **Customer managed** | **キーポリシー** を自分で管理；コースではキーあたり **約 1 ドル/月** + **10,000 回 API あたり約 0.03 ドル** — 料金確認。 |

### キーポリシーとクロスアカウント

- **すべての KMS キーにキーポリシーが必須** — なければ**誰も**キーを使えない（**S3** バケットだけ IAM より**厳しい**話）。
- **デフォルト**のキーポリシー：**アカウント** + **IAM** を信頼して細かい allow。
- **カスタム**ポリシーで**最小権限**と**クロスアカウント**アクセス（例：暗号化 **EBS** スナップショットを共有：ソース側 **CMK** ポリシーが相手アカウントを信頼；相手がスナップショットを**コピー**し**自分の CMK** で**再暗号化**）。

### リージョナルキーと EBS

- キーは**リージョン**単位。**クロスリージョン**の **EBS** スナップショットコピーは、**宛先リージョン**の **CMK** で再暗号化される（そのワークフローでは同一論理キーがリージョンをまたがない）。

### ローテーション

- **AWS 管理 KMS キー：** 約**毎年**自動ローテーション。
- **カスタマー管理の対称鍵：** **90** ～ **2,560** 日の間で**自動**ローテーションをオプション（デフォルトは**約 1 年**の話が多い）；**自動**および**オンデマンド**ローテーションは**同じキー ID** を保ちつつ**バッキングキー**材料が入れ替わる；古い暗号文は復号可能。
- **オンデマンドローテーション：** **カスタマー管理の対称鍵**のみ；自動スケジュールを置き換えない；**頻度**は**サービスクォータ**の対象。
- **手動ローテーション：** KMS の自動より速い周期が必要な場合など — **新しい**キー（**新しいキー ID**）を作成し、**古い**キーは**復号**のために残し、**UpdateAlias** で**エイリアス**を付け替えてアプリは**同一エイリアス名**を維持。
- **非対称**および**インポート**キー：**エイリアス**ベースの**手動**ローテーションパターン；**インポート**キーは**手動**の材料更新フロー（エイリアスが役立つ）。

### マルチリージョンキー（MRK）

- **プライマリ**と他リージョンの**レプリカ**が**同一キー ID** と**同一鍵材料**を共有し、**リージョン A** で暗号化して**リージョン B** で**暗号文を再暗号化せず**復号できる（プライマリのローテーションは**レプリケート**）。
- 各レプリカは**独自のキーポリシー**；MRK は単一の「グローバル」オブジェクトではない。
- **グローバル DynamoDB**／**Aurora**、**クロスリージョン**の**クライアント側**暗号化など、本当に**論理 1 キー**が必要なときに。原則は**リージョナルキー**を優先し、MRK の明確な理由がない限り。

### 削除と安全

- 削除を**スケジュール**すると **7–30 日**の**待機期間**。**削除待ち**中はキーを**暗号化操作**に使えない（依存サービスが**失敗**）；**スケジュールされたローテーション**は停止；期間中は**削除**を**キャンセル**可能。
- 不明なときは**無効化**を先に。**自動化：** **削除待ち**キーをまだ参照するアプリがあると **KMS** 呼び出しが**拒否**される — **CloudTrail** → **CloudWatch Logs** メトリクスフィルタ → **アラーム** → **SNS**。

### EBS の CMK を変える

- 既存の **EBS** ボリュームの **CMK** を**その場**で変えられない：**スナップショット** → スナップショットから**新しい**ボリュームを作成し**新しい KMS キー**を選択（再暗号化パス）。

## AWS Certificate Manager（ACM）

- **ALB/CLB/NLB**、**CloudFront**、**API Gateway** 上の **HTTPS** 用 **TLS** 証明書の**プロビジョニング・管理・デプロイ** — **ACM** が発行した**パブリック**証明書を任意の **EC2** に**エクスポート**する用途ではない（**ACM** 発行の**パブリック**証明書の**秘密鍵**は **ACM** の信頼境界内）。
- **パブリック** ACM 証明書：**無料**；**ACM** が発行した証明書は約**60 日**前から**自動更新**。
- **検証：** **DNS**（自動化には推奨；**Route 53** がレコードを自動作成可能）またはドメイン連絡先への**メール**。
- **インポート**した**パブリック**証明書：**ACM** の自動更新なし；**EventBridge** が約**45** 日前から**毎日**期限イベントを発行（設定可能）；**AWS Config** マネージドルール **`acm-certificate-expiration-check`** が期限が近い証明書を**非準拠**に — **Lambda**／**SNS**／**SQS** へ連携可能。
- **ALB：** **HTTP → HTTPS** の**リスナールール**は任意。
- **API Gateway カスタムドメイン：** **Edge-optimized** → トラフィックは **CloudFront** 経由 → **ACM** は **us-east-1**；**Regional** → API ステージと**同じリージョン**の **ACM**；**Private** API → **VPC インターフェースエンドポイント** + **リソースポリシー**。

## AWS Secrets Manager と Systems Manager Parameter Store

### Secrets Manager

- **シークレット**向けに、**Lambda** での**スケジュール**付き**自動ローテーション**をオプション（**RDS**、**Redshift**、**DocumentDB** などの AWS 管理ローテーション Lambda、または API キーなどの**カスタム** Lambda）。
- 保存された秘密の材料には **KMS** 暗号化が**必須**。
- **マルチリージョンシークレット：** 他リージョンへ**レプリケート**；**DR** 後にレプリカを**昇格**。
- **料金**（コースの目安）：**シークレットあたり約 0.40 ドル/月**、**10,000 API 呼び出しあたり約 0.05 ドル**、**30 日** トライアル — 料金確認。
- **CloudTrail** は **API 呼び出し**と **Secrets Manager 固有の非 API イベント**（例：**RotationStarted**、**RotationSucceeded**、**RotationFailed**、**RotationAbandoned**、シークレットバージョン削除のライフサイクル）を記録。**RotationFailed** のメトリクスフィルタ → **CloudWatch** アラーム → **SNS**；失敗したローテーションは **Lambda** の **CloudWatch Logs** でデバッグ。

### Parameter Store

- **より広い**パラメータ保管；**低コスト**；**KMS** 暗号化は**任意**（**SecureString**）。
- **ネイティブ**のローテーションなし — **EventBridge** スケジュール → **Lambda** で資格情報をローテーションし**パラメータを更新**。
- コースで挙がる統合では **SSM** API 経由で **Secrets Manager** のシークレットを**参照**できる場合あり。

## 要点

- **WAF** = **L7** のみ；**ALB**、**API Gateway**、**CloudFront**、**AppSync**、**Cognito** — **NLB** ではない；**CloudFront** ACL は **us-east-1** の**グローバル**；**静的 IP + WAF** は **GA + ALB + WAF**。
- **Shield Standard** と **Advanced**；**Firewall Manager** で **マルチアカウント** の **WAF**／**Shield**／**SG**／**Network Firewall**／**DNS Firewall** と**新規リソースの自動適用**。
- **Inspector** = **ECR**／**EC2**／**Lambda** の **CVE** 型スキャン + **到達性**；**Macie** = **S3** の **PII** 発見。
- **ログ** ソース → **S3** → **Athena**；ログバケットを**ロック**し**コンプライアンス**向けに**保持**。
- **GuardDuty** = **CloudTrail** + **VPC Flow** + **DNS**（+ オプション）；**マイニング** findings；**EventBridge** 自動化。
- **Trusted Advisor** = **6 つの柱**；**Business/Enterprise** で**全機能**；**Org** 集約は**サポート**と **trusted access** が適切なとき。
- **Security Hub** の前提は **Config**；主要セキュリティサービス + **パートナー** の findings を集約；調査は **Detective**；**マルチアカウント** は**委任管理者**。
- **Audit Manager** = **GDPR**、**HIPAA**、**PCI**、**SOC 2** などの**継続的**フレームワーク証拠。
- **KMS** = キー利用はすべて **CloudTrail**；**対称**／**非対称**；**AWS owned**／**AWS managed**／**customer managed**；**キーポリシー必須**；**クロスリージョン EBS** = **再暗号化**；クロスアカウント暗号化スナップショット = **キーポリシー** + **コピー** + **宛先 CMK**；**ローテーション** と **エイリアス** による**手動**ローテーション；**MRK** は特定の**クロスリージョン**暗号モデル；**削除待ち**中は暗号化不可；**EBS CMK** 変更は**スナップショット**経由。
- **ACM** = **マネージド** AWS エンドポイント向け **TLS**；**DNS** 検証 + **自動更新**；**インポート**証明書は **EventBridge**／**Config** で管理；**API Gateway** **エッジ** = **us-east-1** cert。
- **Secrets Manager** = **ローテーション** + **KMS** + **マルチリージョン** + 豊富な **CloudTrail** **イベント**；**Parameter Store** = **安価**、**柔軟**、**DIY** ローテーション、**KMS** は任意。

---
*関連記事：[AWS DataSync and AWS Backup: Disaster Recovery Notes](/ja/posts/aws-datasync-and-backup-disaster-recovery-notes)。*

---
*Claudeによる翻訳*
