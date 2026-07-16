---
title: "POODR 第5章：duck typing でコストを削減する"
date: "2026-07-15"
excerpt: "クラスではなく振る舞いによって定義されるクラス横断的なインターフェース — case-on-class や responds_to? のチェックの裏に隠れたダックを見抜き、オブジェクトをその振る舞いによって信頼する。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "duck-typing", "polymorphism", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 5
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## 概要

第4章は単一クラスのインターフェースについてでした。第5章はクラスを*横断*するインターフェース — オブジェクトがどのクラスであるかではなく、どのメッセージに応答するかによって定義されるインターフェースについてです。これらが **duck type** であり、Ruby のような動的型付け言語において変更のコストを削減するための最も強力なツールのひとつです。

## duck typing とは何か

「アヒルのように歩き、アヒルのように鳴くなら、それはアヒルだ。」Ruby では、オブジェクトの型はそのクラスではなく、それが何を*する*かによって決まります。duck type は **特定のクラスに結びつかない公開インターフェース** です — 期待されるメッセージを実装しているオブジェクトであれば、実際のクラスが何であれ、その役割を果たすことができます。

Ruby はコンパイル時に型をチェックしないため、オブジェクトを*それが応答するメッセージ*を中心に自由に設計できます。同じメッセージにすべて応答するオブジェクトの集合を見つけたとき、あなたは duck type を見つけたのです — 多くのクラスが果たせる役割です。具象クラスではなくこの役割に依存することで、結合度が劇的に緩みます。

## 隠れたダックを見抜く

duck type が*欠けている*ことを示す最も明確なシグナルは、クラスによって分岐するコードです。Metz は注意すべきいくつかのパターンを挙げています。

### クラスによって分岐する `case` 文

```ruby
class Trip
  attr_reader :bicycles, :customers, :vehicle

  def prepare(preparers)
    preparers.each do |preparer|
      case preparer
      when Mechanic
        preparer.prepare_bicycles(bicycles)
      when TripCoordinator
        preparer.buy_food(customers)
      when Driver
        preparer.gas_up(vehicle)
        preparer.fill_water_tank(vehicle)
      end
    end
  end
end
```

このコードは「あなたは何のクラスか？」と尋ね、それからどのメッセージを送るかを決めています。新しい準備者が増えるたびに `when` 節が追加を強いられます。硬直的で、成長し続ける運命にあります。

### `kind_of?` と `is_a?`

`preparer.kind_of?(Mechanic)` をチェックするのは、別の装いをまとった同じ問題です — 呼び出し元を具象クラスに結合してしまいます。

### `responds_to?`

```ruby
if preparer.responds_to?(:prepare_bicycles)
  # ...
elsif preparer.responds_to?(:buy_food)
```

これは振る舞いをチェックしているため、より「ダックらしく」見えますが、それでも特定のクラスの振る舞いを列挙し、外部からそれらを制御しています。クラスをチェックするよりは結合度が低いものの、まだ知りすぎています。

これら3つのパターンには共通の根本原因があります。送り手が協力者の具象クラスについて知りすぎており、オブジェクトを信頼する代わりに振る舞いを指図しているのです。

## ダックを見つけて信頼する

解決策は、その根底にある役割を認識することです。すべての準備者はひとつの抽象を共有しています。それぞれが **旅行を準備できる** のです。duck type — 単一のメッセージ `prepare_trip` を持つ `Preparer` の役割 — を定義し、各クラスが自分なりのやり方で実装できるようにします。

```ruby
class Trip
  attr_reader :bicycles, :customers, :vehicle

  def prepare(preparers)
    preparers.each { |preparer| preparer.prepare_trip(self) }
  end
end

class Mechanic
  def prepare_trip(trip)
    trip.bicycles.each { |bicycle| prepare_bicycle(bicycle) }
  end
end

class TripCoordinator
  def prepare_trip(trip)
    buy_food(trip.customers)
  end
end

class Driver
  def prepare_trip(trip)
    vehicle = trip.vehicle
    gas_up(vehicle)
    fill_water_tank(vehicle)
  end
end
```

`case` 文は消えました。`Trip` は今や `Mechanic`、`Driver`、`TripCoordinator` ではなく、抽象的な `Preparer` duck type に依存しています。新しい種類の準備者を追加しても、`Trip` への変更は*一切*必要ありません — ただ `prepare_trip` に応答すればよいのです。これが **polymorphism** です。多くのオブジェクトが同じメッセージに、それぞれのやり方で応答するのです。

## 動的型付けのトレードオフ

duck typing が可能なのは、Ruby が動的型付けだからです。Metz は、静的型付け対動的型付けという永遠の議論に真正面から取り組んでいます。

- **静的型付け** は、コンパイラが型エラーを捕捉しコードを文書化することを約束します。しかし、ダックを可能にする柔軟性を犠牲にします。
- **動的型付け** は、簡潔で柔軟なコードを書き、自由にメタプログラミングすることを可能にしますが、コンパイル時の保証を代償とします。

実用的な立場：Ruby は動的型付け言語*である*のだから、それを受け入れましょう。オブジェクトが送ったメッセージに応答することを信頼しましょう。この信頼 — 具象クラスではなく抽象インターフェースに依存すること — こそが、コードを柔軟にし、変更を安価にするのです。

## 重要なポイント

1. **duck type は特定のクラスとは無関係な公開インターフェースである** — オブジェクトの型は、それが何であるかではなく、何をするかによって定義される。
2. **case-on-class、`kind_of?`/`is_a?`、`responds_to?` のチェックは手がかりである** — duck type が名付けられるのを待って隠れているのだ。
3. **クラスのチェックを共有された役割に置き換える**：抽象インターフェースを定義し、各クラスに多態的に実装させる。
4. **duck type に依存することで具象クラスから切り離される** ため、既存のコードを変更せずに新しい実装者を追加できる。
5. **duck typing は信頼に基づく** — メッセージを送り、受け手が適切に応答することを信頼する。
6. **Ruby の動的型付けと戦うのではなく受け入れる**。それがもたらす柔軟性は、欠陥ではなく機能である。

---

> 🌐 *Claudeによる翻訳*
