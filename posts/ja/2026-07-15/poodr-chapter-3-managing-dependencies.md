---
title: "POODR 第3章：依存関係を管理する"
date: "2026-07-15"
excerpt: "依存関係を認識し、隔離し、逆転させる — dependency injection、抽象に依存すること、そして依存が向くべき方向をどう選ぶか。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "dependencies", "dependency-injection", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 3
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## 概要

オブジェクトは有用なことを行うために協調しなければならないため、依存関係は避けられません。第3章は、それらの依存関係を制御下に置くことについてです。すなわち、依存関係が存在するときにそれを認識し、最小化し、そして — 最も重要なのは — 各クラスが自分自身よりも変化しにくいものに依存するように配置することです。

## 依存関係を認識する

あるオブジェクトが別のオブジェクトへの依存関係を持つのは、その別のオブジェクトが変化したときに、このオブジェクトも変更を強いられる可能性がある場合です。Metz は、オブジェクトが知ることを避けるべき4種類の依存関係を挙げています。

1. **別のクラスの名前。**（`Gear` は `Wheel` という名前のクラスが存在することを期待している。）
2. **`self` 以外のものへ送るつもりのメッセージの名前。**（`Gear` は `Wheel` が `diameter` に応答することを期待している。）
3. **メッセージが必要とする引数。**（`Gear` は `Wheel.new` が `rim` と `tire` を必要とすることを知っている。）
4. **それらの引数の順序。**（`Gear` は `rim` が `tire` の前に来ることを知っている。）

これらの知識の一つひとつが2つのクラスを結合します。ある程度の結合は必要ですが、不必要な依存関係はすべて、クラスを変更したり再利用したりすることを難しくします。

以下は、密結合した出発点です。

```ruby
class Gear
  def initialize(chainring, cog, rim, tire)
    @chainring = chainring
    @cog = cog
    @rim = rim
    @tire = tire
  end

  def gear_inches
    ratio * Wheel.new(rim, tire).diameter   # too many dependencies!
  end
end
```

`Gear` は *クラス名* `Wheel`、*メッセージ* `diameter`、そして `Wheel.new` が必要とする *引数*（およびその *順序*）を知っています。

## オブジェクト間の結合

`Gear` が `Wheel` について知れば知るほど、両者はより密に結合します。密結合したオブジェクトは単一の実体のように振る舞います — 一方を巻き込まずにもう一方を再利用したりテストしたりできず、一方への変更がもう一方に波及します。以下の技法はその結合を緩めます。

## 疎結合なコードを書く

### 依存関係を注入する

`Gear` の内部に `Wheel` というクラス名をハードコードする代わりに、wheel オブジェクトを渡します。`Gear` は自分が保持しているのが *どんな種類* のオブジェクトかを知る必要はありません — それが `diameter` に応答することだけを知っていればよいのです。

```ruby
class Gear
  attr_reader :chainring, :cog, :wheel
  def initialize(chainring, cog, wheel)
    @chainring = chainring
    @cog = cog
    @wheel = wheel
  end

  def gear_inches
    ratio * wheel.diameter   # any object that responds to `diameter`
  end
end

Gear.new(52, 11, Wheel.new(26, 1.5)).gear_inches
```

これが **dependency injection**（依存性の注入）です。`Gear` は今や `Wheel` から切り離され、`diameter` に応答できるほど「duck-like」なものであれば何とでも動作します。

### 依存関係を隔離する

依存関係を取り除けない場合は、それが目に見えて封じ込められるように隔離します。

- **インスタンス生成を隔離する。** どうしてもオブジェクトを注入できない場合は、少なくとも `gear_inches` のようなビジネスロジックのメソッドの奥深くではなく、`initialize` メソッド（または専用のメソッド）の中で生成しましょう。
- **脆弱な外部メッセージを隔離する。** 他のオブジェクトへ送るメッセージを自分自身のメソッドで包み、外部の変更が一箇所だけに触れるようにします。

```ruby
def gear_inches
  ratio * diameter
end

def diameter
  wheel.diameter   # the one place that knows wheel responds to `diameter`
end
```

### 引数順序への依存を取り除く

固定順序の位置引数はもろいものです — コンストラクタの順序を並べ替えると、すべての呼び出し元が壊れます。**keyword arguments**（キーワード引数）を使えば、順序が問題にならなくなり、各引数が呼び出し側で名前付けされます。

```ruby
class Gear
  def initialize(chainring:, cog:, wheel:)
    @chainring = chainring
    @cog = cog
    @wheel = wheel
  end
end

Gear.new(chainring: 52, cog: 11, wheel: Wheel.new(26, 1.5))
```

引数が固定順序であるクラスを自分が所有していない場合は、順序を隠す **factory method**（ファクトリメソッド）でそれを包み、依存関係を一箇所に留めます。

## 依存の方向を管理する

すべての依存関係には方向があり — たいていはそれを反転させることができます。`Gear` が `Wheel` に依存することもできれば、`Wheel` が `Gear` に依存することもできます。どう選べばよいのでしょうか。

**自分よりも変化する頻度が低いものに依存しましょう。** 3つの考え方が選択の指針となります。

- あるクラスは他のクラスよりも **変化しやすい**。
- あるクラスは **多くの** 他のクラスから **依存されている**（多くの依存元を持つ）。
- **変化しやすく** *かつ* **広く依存されている** クラスに依存するのは危険です — そこでの変更は広範囲の破損を引き起こします。

経験則は次の通りです。**安定性の方向に依存しましょう。** 抽象は具象よりも安定しているので、抽象に依存しましょう。フレームワークのクラスや成熟したライブラリは、あなた自身の移ろいやすいアプリケーションコードよりも変化しにくいため、それらに依存するのはたいてい安全です。

## 重要なポイント

1. **依存関係は、あるオブジェクトの変更が別のオブジェクトの変更を強いる可能性があるときに存在する** — クラス名、メッセージ名、引数リスト/順序についての知識に注意しましょう。
2. **依存関係を注入する** ことで、クラスが具体的な *クラス* ではなく *メッセージ*（役割）に依存するようにします。
3. 取り除けない **依存関係を隔離する** — インスタンス生成と外部メッセージを専用のメソッドに封じ込めます。
4. **引数順序への依存を取り除く** にはキーワード引数を使い、外部の固定順序コンストラクタはファクトリメソッドで包みます。
5. **依存の方向を管理する**：自分よりも安定していて変化しにくいものに依存しましょう。
6. **具象ではなく抽象に依存する** — これが Dependency Inversion の考え方を実践に移したものです。

---

> 🌐 *Claudeによる翻訳*
