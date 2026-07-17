---
title: "POODR 第8章：compositionでオブジェクトを組み合わせる"
date: "2026-07-16"
excerpt: "部品からオブジェクトを組み立てる — composition vs inheritance、has-a関係、factoryとroleによるモデリング、そしてinheritance・modules・compositionの選択基準。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "composition", "inheritance", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 8
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## 概要

**composition**とは、異なる部品を組み合わせて全体を作り、全体が部品の単なる総和*以上*になる行為です。ソフトウェアでは、*である*のではなく*持つ*ことによって、小さなオブジェクトから大きなオブジェクトを組み立てることを意味します。第8章では自転車の例をもう一度組み直します — 今度はinheritanceではなくcompositionで — そして、inheritance、modules、compositionのいずれを使うべきかについて具体的な指針を示します。

## 部品から自転車を組み立てる

これまでの章では、自転車のバリエーション（`RoadBike`、`MountainBike`）をinheritance階層でモデリングしていました。しかし、自転車間で実際に異なるのは**部品（parts）**です。だから「これはどんな種類の自転車か？」と問う代わりに、compositionは「この自転車はどんな部品を持っているか？」と問います。

リファクタリングは段階的に進みます：

1. `Bicycle`は`Parts`オブジェクトを**has a**（持つ）し、`spares`をそこに委譲する。

```ruby
class Bicycle
  attr_reader :size, :parts

  def initialize(size:, parts:)
    @size = size
    @parts = parts
  end

  def spares
    parts.spares
  end
end
```

これで`Bicycle`は小さくなりました。`size`に責任を持ち、`Parts`オブジェクトを保持し、`spares`メッセージをそこに転送します。異なる自転車は、異なる`Parts`と組み合わされた`Bicycle`にすぎません。

## Partsオブジェクト → Partオブジェクトのコレクション

`Parts`は個々の部品を知るクラスとして始まりますが、自然な次のステップは、`Parts`が実際には**`Part`オブジェクトのコレクション**であると認識することです。各`Part`には`name`、`description`、そして`needs_spare`かどうかがあります。

```ruby
class Parts
  attr_reader :parts
  def initialize(parts)
    @parts = parts
  end

  def spares
    parts.select { |part| part.needs_spare }
  end
end

class Part
  attr_reader :name, :description, :needs_spare
  def initialize(name:, description:, needs_spare: true)
    @name = name
    @description = description
    @needs_spare = needs_spare
  end
end
```

`Parts`はほぼ配列のように振る舞うようになりました — これは、*配列のようにあるべきか*という有用な疑問を提起します（下記参照）。

## Parts factory

すべての`Part`オブジェクトを手動で構築するのは面倒で、エラーが起きやすいです。**factory** — 他のオブジェクトを製造することが仕事のオブジェクト — は、シンプルな設定データから有効な`Parts`を構築する方法の知識をカプセル化します：

```ruby
module PartsFactory
  def self.build(config, part_class = Part, parts_class = Parts)
    parts_class.new(
      config.collect { |part_config| part_class.new(
        name: part_config[0],
        description: part_config[1],
        needs_spare: part_config.fetch(2, true))
      })
  end
end

road_config = [
  ['chain', '10-speed'],
  ['tire_size', '23'],
  ['tape_color', 'red']
]

road_bike = Bicycle.new(size: 'L', parts: PartsFactory.build(road_config))
```

factoryは設定構造に関するすべての知識を一か所に集約します。factoryが生成する`Part`オブジェクトはとてもシンプル（データを保持し`needs_spare`に答えるだけ）なので、`Part`クラスをfactory内で作成した`Struct`に置き換えることさえできます — 残りのコードは気にしません。なぜなら、*Part duck type*（`name`、`description`、`needs_spare`に応答する）にしか依存していないからです。

## aggregation：composition vs. より緩いhas-a

compositionは、厳密に言えば、全体が部品の*ライフサイクルを制御する*ことを意味します — 部品には独立した存在がありません（段落は正確に一つの文書の一部です）。部品が独立して存在できるより緩い関係（大学は学部を*持つ*が、学部と教授はどんな配置よりも長生きする）は**aggregation**と呼ばれます。区別は微妙ですが、実際にはRubyではどちらも同じ方法でモデリングされます — has-a関係と委譲を通じて。

## inheritanceとcompositionの選択

これが本章の核心です。Metzの指針：

> *is-a*関係には**inheritance**を使い、*has-a*関係には**composition**を使う。

それぞれのアプローチには実際のコストと利点があります。

### inheritanceの利点とコスト

よく設計されたinheritanceは、次のようなコードをもたらします：

- **Reasonable** — スーパークラスの小さな変更が、サブクラス全体に大きく正しい変更をもたらす（template method pattern経由）。
- **Usable** — 新しいサブクラスは、特殊化された差分だけを必要とする。
- **Exemplary** — パターンが新しいサブクラスを正しく追加するよう促す。

しかし、inheritanceは次の場合には不適切な選択です：

- 階層が間違っている（振る舞いを*打ち消す*ためにメソッドをオーバーライドせざるを得ない）、または
- 自分の枝に属さない振る舞いのために階層を横断しようと誘惑される。

最大の弱点：*間違える*コストが高く、inheritanceはコミットメントです。明確に安定した一般から特殊への関係を共有するオブジェクトをモデリングするときに最適です。

### compositionの利点とコスト

compositionされたオブジェクトは、一般に次のようになります：

- **Transparent**で理解しやすい — 明確な責務と分かりやすく定義されたインターフェースを持つ小さなオブジェクト。
- **Flexible** — 同じroleを演じる別の部品と入れ替えられ、新しいオブジェクトを追加することで新しい振る舞いを加えられる。

コスト：compositionされた全体は、メッセージパッシングを通じて協調する多くの小さなオブジェクトに依存するため、部品の*組み合わせ*は単一の階層ほど自明ではないかもしれません。compositionは「has-a」の全体に優れていますが、部品間でコードを共有する仕組みを自動的には整えません — それはmodulesとinheritanceの役割です。

## 関係の選択：ルールのまとめ

本章は、技法を選ぶための実用的な指針で締めくくります：

- **is-a関係にはinheritanceを使う。** オブジェクトがより一般的なものの特殊化された種類であり、階層が浅く安定しているとき、古典的inheritanceが報われる。
- **behaves-like-a関係にはduck type（とmodules）を使う。** それ以外は無関係なオブジェクトが共通のroleを演じる必要があるとき、roleをduck typeとして定義し、共有コードがあればmoduleに入れる。
- **has-a関係にはcompositionを使う。** オブジェクトが部品で構成されている、またはあるものを多数持っているとき、それらの部品を与えて委譲する。これが最も安全なデフォルトであることが多い。

Metzの全体的な傾向：**迷ったらcompositionを優先する。** オブジェクトを小さく柔軟に保ち、compositionの判断を間違えたコストは、inheritanceの判断を間違えたコストよりはるかに低い。inheritanceとmodulesは強力だが硬直的；関係が本当にそれを正当化するときだけ手を伸ばす。

## 重要なポイント

1. **compositionはhas-a関係と委譲を通じて部品から全体を組み立てる** — オブジェクトは*である*のではなく*持つ*。
2. **自転車をcompositionで組み直す**と、硬直的な階層が小さく交換可能なオブジェクトに変わる：`Bicycle` has a `Parts`、それは`Part`のコレクション。
3. **factoryを使う**ことで、設定データから有効なcompositionオブジェクトを組み立てる方法の知識をカプセル化する。
4. **部品のクラスではなくduck typeに依存する** — そうすれば`Part`は単純な`Struct`になっても何も壊れない。
5. **inheritanceはis-a、modules/duck typeはbehaves-like-a、compositionはhas-a。**
6. **inheritanceは間違えたときのコストが高い**；compositionは柔軟で透明性を保つので、真のis-a関係がinheritanceを正当化しない限り**compositionを優先する**。

---

> 🌐 *Claudeによる翻訳*
