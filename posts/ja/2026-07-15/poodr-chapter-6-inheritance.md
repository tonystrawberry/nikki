---
title: "POODR 第6章：継承による振る舞いの獲得"
date: "2026-07-15"
excerpt: "正しく行うクラス継承 — どこに適合するかを見極め、具象クラスを抽象スーパークラスへとリファクタリングし、super の代わりにフックを用いた template method パターンを使う。"
author: "Tony Duong"
category: "note"
categories: ["note", "tech"]
tags: ["poodr", "ruby", "object-oriented-design", "inheritance", "template-method", "sandi-metz"]
coverImage: ""
collection: "poodr"
collectionOrder: 6
collectionTitle: "Practical Object-Oriented Design in Ruby"
---

## 概要

第6章では**クラス継承（classical inheritance）**を紹介する。これはスーパークラス／サブクラスの階層を通じてクラス間で振る舞いを共有する仕組みだ。継承は強力だが、誤用しやすい。本章はその全過程をたどる。継承が適切な道具である場面を見極め、抽象を発見し、それを抽象スーパークラスへ移し、最後に階層を疎結合にして、サブクラスが親とどう協調するかを知らなくてもよいようにする。

## クラス継承を理解する

継承とは、その核心において、**メッセージの自動委譲**の仕組みである。オブジェクトが理解できないメッセージを受け取ると、そのメッセージを継承チェーンの上位へと転送する。階層を定義するとは、処理されないメッセージが妥当な方向へ進むようにクラスを配置することにほかならない。

ここでの「クラシカル（classical）」は、（プロトタイプベースやモジュールベースではなく）*クラス*ベースの継承を指す。サブクラスはスーパークラスの**専門化（is-a）**である — スーパークラスであるすべてに加えて、さらに多くを備えているべきだ。

## 継承を使う場所を見極める

本章は、複数種類の自転車を扱うほどに肥大化した単一の `Bicycle` クラスから始まる。それはある不吉な臭いに満ちている。すなわち、*一部*の自転車には当てはまるが他には当てはまらない属性や振る舞いが、`style` 変数のチェックによって制御されているのだ。

```ruby
class Bicycle
  attr_reader :style, :size, :tape_color, :front_shock, :rear_shock

  def spares
    if style == :road
      { chain: '10-speed', tire_size: '23', tape_color: tape_color }
    else
      { chain: '10-speed', tire_size: '2.1', rear_shock: rear_shock }
    end
  end
end
```

この `if style == ...` が手がかりだ。**「型」や「カテゴリ」の名前を保持する変数が、どのメッセージを送るかを決めるために使われているのは、継承が役立つかもしれないという古典的なサインである。** それは、1つのクラスが実際には2つになろうとしていることを意味する。

## 継承の誤用

魅力的に見える最初の一手は、`MountainBike` を既存の具象クラス `Bicycle` のサブクラスにすることだ。これは失敗する。なぜなら `Bicycle` は**自転車の一般的な振る舞いとロードバイク固有の事柄を混ぜ合わせた具象クラス**だからだ。すると `MountainBike` は、欲しくないロードバイクの振る舞い（`tape_color` など）を継承し、それを回避する羽目になる。継承した振る舞いを*打ち消す*ためにメソッドをオーバーライドするサブクラスは、階層が間違っているサインだ。

教訓はこうだ。**すでに具象的で特化しているクラスの良いサブクラスは作れない。** スーパークラスは抽象でなければならない。

## 抽象を見つける

継承が意味をなすには、2つの条件が成り立たなければならない。

1. モデル化しようとしているオブジェクトが、真の**is-a（一般–特化）**の関係を持っていること。
2. 階層を構築するために正しい**コーディング技法**を使えること。

戦略は、**すべてを下へ押し下げ**、そして**抽象を引き上げる**ことだ。

1. 空の抽象スーパークラス `Bicycle` を作る。
2. `RoadBike` と `MountainBike` をそれから継承させ、まず*すべて*の振る舞いを具象サブクラスへ下ろす。（これは、抽象を前もって推測しようとするより安全だ。）
3. 次に、本当に共有され一般的な振る舞いを、一度に1つずつ `Bicycle` へと**昇格させる（promote）**。

*上へ*昇格させる方が、*下へ*降格させるより安全だ。もし抽象クラスに具象的な何かをうっかり残せば、すべてのサブクラスが影響を受ける。だが昇格させるのが少なすぎた場合は、影響を受けたサブクラスだけが壊れ、それは見つけやすい。

```ruby
class Bicycle
  attr_reader :size          # shared by all bikes -> promoted up

  def initialize(args = {})
    @size = args[:size]
  end
end

class RoadBike < Bicycle
  attr_reader :tape_color    # road-specific -> stays down

  def initialize(args)
    @tape_color = args[:tape_color]
    super(args)
  end
end
```

## template method パターン

抽象スーパークラスが*アルゴリズム*を定義し、サブクラスが埋めるメソッドを呼び出す。これが **template method パターン**だ。スーパークラスがメッセージを送り、各サブクラスが自身の専門化されたバージョンを提供する。

```ruby
class Bicycle
  def initialize(args = {})
    @size = args[:size]
    @chain = args[:chain] || default_chain
    @tire_size = args[:tire_size] || default_tire_size
  end

  def default_chain            # common default
    '10-speed'
  end
end

class RoadBike < Bicycle
  def default_tire_size        # subclass supplies the specialization
    '23'
  end
end
```

**すべての template method に対して、常に妥当なデフォルトを提供するか、明示的に例外を発生させること。** もし `Bicycle` が `default_tire_size` を呼び出すのに定義していなければ、それを実装し忘れた将来のサブクラスの作者は、分かりにくい `NameError` に遭遇する。役立つメッセージとともに大きな声で失敗させる方がよい。

```ruby
def default_tire_size
  raise NotImplementedError,
        "#{self.class} should have implemented ..."
end
```

## スーパークラスとサブクラス間の結合を管理する

素朴な階層では、各サブクラスの `initialize` と `spares` が `super` を呼ぶことを強いられる。それは脆い。サブクラスをスーパークラスの*アルゴリズム*に結合してしまうからだ。新しいサブクラスの作者が `super` を送り忘れると、オブジェクトは微妙な形で壊れる。これが「**サブクラスは協調の仕方を知っていなければならない**」という罠だ。

その修正が **hook method パターン**だ。スーパークラスが完全なアルゴリズムを定義し、サブクラスが任意でオーバーライドできる*hook*メッセージを送る。サブクラスは `super` を一度も呼ぶことなく専門化を提供する。

```ruby
class Bicycle
  def initialize(args = {})
    @size = args[:size]
    @chain = args[:chain] || default_chain
    @tire_size = args[:tire_size] || default_tire_size
    post_initialize(args)      # hook: subclass contributes here
  end

  def post_initialize(args)
    nil                         # default: do nothing
  end

  def spares
    { tire_size: tire_size, chain: chain }.merge(local_spares)
  end

  def local_spares             # hook for subclass-specific spares
    {}
  end
end

class RoadBike < Bicycle
  def post_initialize(args)    # no super needed
    @tape_color = args[:tape_color]
  end

  def local_spares
    { tape_color: tape_color }
  end
end
```

これで、スーパークラスが*いつ（when）*（アルゴリズム）を所有し、サブクラスは*何を（what）*（自身の専門化）だけを所有する。サブクラスはもはや抽象的なアルゴリズムを知る必要がなく、ただ空欄を埋めるだけだ。これは結合を劇的に減らし、階層を拡張しやすくする。

## 重要なポイント

1. **継承はクラス階層を上へたどるメッセージの自動委譲である**。サブクラスはスーパークラスの真の専門化（is-a）でなければならない。
2. **条件分岐を駆動する「型」変数**（`if style == ...`）は、継承が役立つかもしれないというサインだ。
3. **具象クラスを決してサブクラス化しない** — スーパークラスは抽象でなければならず、すべてのサブクラスに共通する振る舞いだけを含む。
4. **すべてを下へ押し下げ、共有される振る舞いを引き上げることで抽象を構築する** ; 上へ昇格させる方が下へ降格させるより安全だ。
5. **template method パターンを使う**ことで、スーパークラスがアルゴリズムを定義し、サブクラスが専門化を提供するようにする — そして常にデフォルトを提供するか、`NotImplementedError` を発生させる。
6. **サブクラスに `super` を呼ばせることを強いるより、hook メソッドを優先する**。そうすればサブクラスはスーパークラスのアルゴリズムを知る必要がなく、両者は疎結合のままでいられる。

---

> 🌐 *Claudeによる翻訳*
