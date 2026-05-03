export type Language = "en" | "jp" | "ua" | "zh" | "kr";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "jp", label: "JP", flag: "🇯🇵" },
  { code: "ua", label: "UA", flag: "🇺🇦" },
  { code: "zh", label: "ZH", flag: "🇨🇳" },
  { code: "kr", label: "KR", flag: "🇰🇷" },
];

export interface Translations {
  nav: {
    home: string;
    catch: string;
    collection: string;
    map: string;
    friends: string;
    account: string;
    leaderboard: string;
  };
  home: {
    welcomeBack: string;
    welcomeBackName: (name: string) => string;
    readyToCatch: string;
    quickCatch: string;
    quickCatchPlaceholder: string;
    catch: string;
    collectionProgress: string;
    snackSpotsFound: string;
    worldwide: string;
    recentlyCaught: string;
    viewAll: string;
    noCaughtYet: string;
    startCollection: string;
    scanBarcode: string;
    caughtOf: (caught: number, total: number) => string;
    leaderboard: string;
    noCatches: string;
  };
  collection: {
    title: string;
    subtitle: (caught: number, total: number) => string;
    loading: string;
    searchPlaceholder: string;
    all: string;
    caught: string;
    uncaught: string;
    scanToCatch: string;
    noFlavorsFound: string;
    tryDifferent: string;
    removeFromCollection: string;
    catchIt: string;
    inYourCollection: string;
    brand: string;
    barcode: string;
    editBarcode: string;
    addBarcode: string;
    manageBarcode: string;
    done: string;
    primary: string;
    alternates: string;
    addAlternate: string;
  };
  catch: {
    title: string;
    subtitle: string;
    cameraScanner: string;
    manualEntry: string;
    enterBarcode: string;
    lookUp: string;
    barcodePreview: string;
    lookingUp: string;
    inDatabase: string;
    catchIt: string;
    cancel: string;
    alreadyInCollection: string;
    newFlavor: string;
    newFlavorDesc: (barcode: string) => string;
    jpName: string;
    jpNamePlaceholder: string;
    enName: string;
    enNamePlaceholder: string;
    category: string;
    color: string;
    saveAndCatch: string;
    manageBarcodes: string;
  };
  map: {
    title: string;
    subtitle: string;
    addedBy: (username: string) => string;
    confirmedFlavors: string;
    addFlavor: string;
    addLocation: string;
    verify: string;
    unverify: string;
    verified: string;
    delete: string;
    noFlavors: string;
    fromYou: (dist: string, unit: string) => string;
    searchLocation: string;
    locationName: string;
    city: string;
    country: string;
    price: string;
    currency: string;
    save: string;
    saving: string;
    cancel: string;
    addedByLabel: string;
  };
  friends: {
    title: string;
    subtitle: string;
    addFriend: string;
    searchUser: string;
    usernamePlaceholder: string;
    yourFriends: string;
    noFriendsYet: string;
    noFriendsHint: string;
    alreadyFriends: string;
    viewCollection: string;
    removeFriend: string;
    friendAdded: string;
    friendRemoved: string;
    userNotFound: string;
    thatsYou: string;
    caughtOf: (caught: number, total: number | string) => string;
    collectionOf: (name: string) => string;
    nothingCaught: string;
  };
  account: {
    title: string;
    subtitle: string;
    caught: string;
    totalFlavors: string;
    collectionProgress: string;
    signOut: string;
    signOutDesc: string;
    signOutButton: string;
    save: string;
    notLoggedIn: string;
  };
  leaderboard: {
    title: string;
    subtitle: string;
    rank: string;
    collector: string;
    caughtCount: string;
    progress: string;
    you: string;
    yourRank: string;
    noEntries: string;
    beFirst: string;
    caughtOf: (caught: number, total: number) => string;
  };
}

const en: Translations = {
  nav: {
    home: "Dashboard",
    catch: "Catch",
    collection: "Collection",
    map: "Snack Map",
    friends: "Friends",
    account: "Account",
    leaderboard: "Leaderboard",
  },
  home: {
    welcomeBack: "Welcome Back!",
    welcomeBackName: (name) => `Welcome Back, ${name}!`,
    readyToCatch: "Ready to catch some fizzy flavors today?",
    quickCatch: "Quick Catch",
    quickCatchPlaceholder: "Type or paste a barcode...",
    catch: "Catch",
    collectionProgress: "Collection Progress",
    snackSpotsFound: "Snack Spots Found",
    worldwide: "worldwide",
    recentlyCaught: "Recently Caught",
    viewAll: "View All",
    noCaughtYet: "No flavors caught yet!",
    startCollection: "Start your collection by scanning your first bottle.",
    scanBarcode: "Scan Barcode",
    caughtOf: (c, t) => `${c} / ${t} caught`,
    leaderboard: "Leaderboard",
    noCatches: "No catches yet — be the first!",
  },
  collection: {
    title: "My Collection",
    subtitle: (c, t) => `You've caught ${c} out of ${t} flavors.`,
    loading: "Loading collection...",
    searchPlaceholder: "Search by name or barcode...",
    all: "All",
    caught: "Caught",
    uncaught: "Uncaught",
    scanToCatch: "Scan to catch →",
    noFlavorsFound: "No flavors found",
    tryDifferent: "Try a different search or filter.",
    removeFromCollection: "Remove from Collection",
    catchIt: "Catch it!",
    inYourCollection: "In your collection",
    brand: "Brand",
    barcode: "Barcode",
    editBarcode: "Edit barcode",
    addBarcode: "Add barcode",
    manageBarcode: "Manage barcodes",
    done: "Done",
    primary: "Primary",
    alternates: "Alternates",
    addAlternate: "Add alternate...",
  },
  catch: {
    title: "Catch a Flavor",
    subtitle: "Scan the JAN/EAN barcode on your Ramune bottle.",
    cameraScanner: "Camera Scanner",
    manualEntry: "Manual Entry",
    enterBarcode: "Enter barcode number...",
    lookUp: "Look up",
    barcodePreview: "Barcode preview",
    lookingUp: "Looking up database...",
    inDatabase: "In database",
    catchIt: "Catch it!",
    cancel: "Cancel",
    alreadyInCollection: "Already in your collection!",
    newFlavor: "New Flavor!",
    newFlavorDesc: (b) => `Barcode ${b} isn't in the database yet. Name it and add it!`,
    jpName: "Japanese name (on bottle)",
    jpNamePlaceholder: "e.g. メロンラムネ",
    enName: "English name",
    enNamePlaceholder: "e.g. Melon Ramune",
    category: "Category",
    color: "Color",
    saveAndCatch: "Save & Catch!",
    manageBarcodes: "Manage barcodes",
  },
  map: {
    title: "Snack Map",
    subtitle: "Find Ramune near you and share your discoveries.",
    addedBy: (u) => `Added by @${u}`,
    confirmedFlavors: "Confirmed Flavors",
    addFlavor: "Add Flavor",
    addLocation: "Add a Location",
    verify: "Verify",
    unverify: "Unverify",
    verified: "Verified",
    delete: "Delete",
    noFlavors: "No flavors confirmed yet.",
    fromYou: (d, u) => `${d} ${u} from you`,
    searchLocation: "Search for a place...",
    locationName: "Location name",
    city: "City",
    country: "Country",
    price: "Price",
    currency: "Currency",
    save: "Save Location",
    saving: "Saving...",
    cancel: "Cancel",
    addedByLabel: "Added by",
  },
  friends: {
    title: "Friends",
    subtitle: "Connect with other collectors.",
    addFriend: "Add a Friend",
    searchUser: "Search User",
    usernamePlaceholder: "username",
    yourFriends: "Your Friends",
    noFriendsYet: "No friends yet",
    noFriendsHint: "Search for users by username to add them.",
    alreadyFriends: "Already friends",
    viewCollection: "Collection",
    removeFriend: "Remove friend",
    friendAdded: "Friend added!",
    friendRemoved: "Friend removed.",
    userNotFound: "User not found.",
    thatsYou: "That's you!",
    caughtOf: (c, t) => `${c} / ${t} caught`,
    collectionOf: (n) => `${n}'s Collection`,
    nothingCaught: "Nothing caught yet!",
  },
  account: {
    title: "Account",
    subtitle: "Your collector profile.",
    caught: "Caught",
    totalFlavors: "Total Flavors",
    collectionProgress: "Collection progress",
    signOut: "Sign out",
    signOutDesc: "Your collection is saved to the cloud and will be here when you log back in.",
    signOutButton: "Sign out",
    save: "Saved!",
    notLoggedIn: "Not logged in.",
  },
  leaderboard: {
    title: "Leaderboard",
    subtitle: "Top collectors worldwide.",
    rank: "Rank",
    collector: "Collector",
    caughtCount: "Caught",
    progress: "Progress",
    you: "You",
    yourRank: "Your Rank",
    noEntries: "No catches yet — be the first!",
    beFirst: "Start your collection to appear here.",
    caughtOf: (c, t) => `${c} / ${t}`,
  },
};

const jp: Translations = {
  nav: {
    home: "ホーム",
    catch: "キャッチ",
    collection: "コレクション",
    map: "マップ",
    friends: "フレンド",
    account: "アカウント",
    leaderboard: "ランキング",
  },
  home: {
    welcomeBack: "おかえり！",
    welcomeBackName: (name) => `おかえり、${name}！`,
    readyToCatch: "今日もラムネを集めよう！",
    quickCatch: "クイックキャッチ",
    quickCatchPlaceholder: "バーコードを入力...",
    catch: "キャッチ",
    collectionProgress: "コレクション進捗",
    snackSpotsFound: "スポット数",
    worldwide: "世界中",
    recentlyCaught: "最近キャッチしたフレーバー",
    viewAll: "すべて見る",
    noCaughtYet: "まだキャッチしていません！",
    startCollection: "最初のボトルをスキャンして始めよう。",
    scanBarcode: "スキャン",
    caughtOf: (c, t) => `${c} / ${t} キャッチ`,
    leaderboard: "ランキング",
    noCatches: "まだキャッチなし — 最初になろう！",
  },
  collection: {
    title: "マイコレクション",
    subtitle: (c, t) => `${t}種類中 ${c}種類キャッチ済み。`,
    loading: "読み込み中...",
    searchPlaceholder: "名前またはバーコードで検索...",
    all: "すべて",
    caught: "キャッチ済み",
    uncaught: "未キャッチ",
    scanToCatch: "スキャンしてキャッチ →",
    noFlavorsFound: "フレーバーが見つかりません",
    tryDifferent: "別の検索条件をお試しください。",
    removeFromCollection: "コレクションから削除",
    catchIt: "キャッチ！",
    inYourCollection: "コレクション済み",
    brand: "ブランド",
    barcode: "バーコード",
    editBarcode: "バーコードを編集",
    addBarcode: "バーコードを追加",
    manageBarcode: "バーコード管理",
    done: "完了",
    primary: "メイン",
    alternates: "サブ",
    addAlternate: "サブバーコードを追加...",
  },
  catch: {
    title: "フレーバーをキャッチ",
    subtitle: "ラムネボトルのJAN/EANバーコードをスキャン。",
    cameraScanner: "カメラスキャナー",
    manualEntry: "手動入力",
    enterBarcode: "バーコードを入力...",
    lookUp: "検索",
    barcodePreview: "バーコードプレビュー",
    lookingUp: "データベースを検索中...",
    inDatabase: "登録済み",
    catchIt: "キャッチ！",
    cancel: "キャンセル",
    alreadyInCollection: "すでにコレクション済み！",
    newFlavor: "新しいフレーバー！",
    newFlavorDesc: (b) => `バーコード ${b} はまだ未登録です。名前をつけて追加しよう！`,
    jpName: "日本語名（ボトルに記載）",
    jpNamePlaceholder: "例：メロンラムネ",
    enName: "英語名",
    enNamePlaceholder: "例：Melon Ramune",
    category: "カテゴリー",
    color: "カラー",
    saveAndCatch: "保存してキャッチ！",
    manageBarcodes: "バーコード管理",
  },
  map: {
    title: "スナックマップ",
    subtitle: "近くのラムネを探して発見を共有しよう。",
    addedBy: (u) => `@${u} が追加`,
    confirmedFlavors: "確認済みフレーバー",
    addFlavor: "フレーバーを追加",
    addLocation: "スポットを追加",
    verify: "認証",
    unverify: "認証解除",
    verified: "認証済み",
    delete: "削除",
    noFlavors: "まだ確認済みフレーバーなし。",
    fromYou: (d, u) => `あなたから ${d} ${u}`,
    searchLocation: "場所を検索...",
    locationName: "スポット名",
    city: "市区町村",
    country: "国",
    price: "価格",
    currency: "通貨",
    save: "スポットを保存",
    saving: "保存中...",
    cancel: "キャンセル",
    addedByLabel: "追加者",
  },
  friends: {
    title: "フレンド",
    subtitle: "他のコレクターとつながろう。",
    addFriend: "フレンドを追加",
    searchUser: "ユーザーを検索",
    usernamePlaceholder: "ユーザーネーム",
    yourFriends: "フレンド一覧",
    noFriendsYet: "まだフレンドがいません",
    noFriendsHint: "ユーザー名でユーザーを検索して追加しよう。",
    alreadyFriends: "すでにフレンドです",
    viewCollection: "コレクション",
    removeFriend: "フレンドを削除",
    friendAdded: "フレンドを追加しました！",
    friendRemoved: "フレンドを削除しました。",
    userNotFound: "ユーザーが見つかりません。",
    thatsYou: "それはあなたです！",
    caughtOf: (c, t) => `${c} / ${t} キャッチ`,
    collectionOf: (n) => `${n} のコレクション`,
    nothingCaught: "まだキャッチなし！",
  },
  account: {
    title: "アカウント",
    subtitle: "コレクタープロフィール。",
    caught: "キャッチ済み",
    totalFlavors: "総フレーバー数",
    collectionProgress: "コレクション進捗",
    signOut: "サインアウト",
    signOutDesc: "コレクションはクラウドに保存されています。",
    signOutButton: "サインアウト",
    save: "保存しました！",
    notLoggedIn: "ログインしていません。",
  },
  leaderboard: {
    title: "ランキング",
    subtitle: "世界のトップコレクター。",
    rank: "順位",
    collector: "コレクター",
    caughtCount: "キャッチ数",
    progress: "進捗",
    you: "あなた",
    yourRank: "あなたの順位",
    noEntries: "まだキャッチなし — 最初になろう！",
    beFirst: "コレクションを始めてここに登場しよう。",
    caughtOf: (c, t) => `${c} / ${t}`,
  },
};

const ua: Translations = {
  nav: {
    home: "Головна",
    catch: "Зловити",
    collection: "Колекція",
    map: "Карта",
    friends: "Друзі",
    account: "Акаунт",
    leaderboard: "Рейтинг",
  },
  home: {
    welcomeBack: "З поверненням!",
    welcomeBackName: (name) => `З поверненням, ${name}!`,
    readyToCatch: "Готовий ловити смаки сьогодні?",
    quickCatch: "Швидкий пошук",
    quickCatchPlaceholder: "Введіть або вставте штрих-код...",
    catch: "Знайти",
    collectionProgress: "Прогрес колекції",
    snackSpotsFound: "Знайдено магазинів",
    worldwide: "по всьому світу",
    recentlyCaught: "Нещодавно зловлені",
    viewAll: "Переглянути всі",
    noCaughtYet: "Ще нічого не зловлено!",
    startCollection: "Почни зі сканування першої пляшки.",
    scanBarcode: "Сканувати",
    caughtOf: (c, t) => `${c} / ${t} зловлено`,
    leaderboard: "Рейтинг",
    noCatches: "Ще немає — будь першим!",
  },
  collection: {
    title: "Моя колекція",
    subtitle: (c, t) => `Ти зловив ${c} з ${t} смаків.`,
    loading: "Завантаження колекції...",
    searchPlaceholder: "Пошук за назвою або штрих-кодом...",
    all: "Всі",
    caught: "Зловлені",
    uncaught: "Незловлені",
    scanToCatch: "Сканувати →",
    noFlavorsFound: "Смаків не знайдено",
    tryDifferent: "Спробуй інший пошук або фільтр.",
    removeFromCollection: "Видалити з колекції",
    catchIt: "Зловити!",
    inYourCollection: "У вашій колекції",
    brand: "Бренд",
    barcode: "Штрих-код",
    editBarcode: "Редагувати штрих-код",
    addBarcode: "Додати штрих-код",
    manageBarcode: "Керувати штрих-кодами",
    done: "Готово",
    primary: "Основний",
    alternates: "Додаткові",
    addAlternate: "Додати додатковий...",
  },
  catch: {
    title: "Зловити смак",
    subtitle: "Скануй JAN/EAN штрих-код на пляшці Ramune.",
    cameraScanner: "Камера",
    manualEntry: "Ввести вручну",
    enterBarcode: "Введіть номер штрих-коду...",
    lookUp: "Знайти",
    barcodePreview: "Прев'ю штрих-коду",
    lookingUp: "Пошук у базі даних...",
    inDatabase: "Є в базі",
    catchIt: "Зловити!",
    cancel: "Скасувати",
    alreadyInCollection: "Вже є у вашій колекції!",
    newFlavor: "Новий смак!",
    newFlavorDesc: (b) => `Штрих-код ${b} ще не в базі. Назви його і додай!`,
    jpName: "Японська назва (на пляшці)",
    jpNamePlaceholder: "напр. メロンラムネ",
    enName: "Англійська назва",
    enNamePlaceholder: "напр. Melon Ramune",
    category: "Категорія",
    color: "Колір",
    saveAndCatch: "Зберегти і зловити!",
    manageBarcodes: "Керувати штрих-кодами",
  },
  map: {
    title: "Карта снеків",
    subtitle: "Знайди Ramune поблизу та ділись відкриттями.",
    addedBy: (u) => `Додав @${u}`,
    confirmedFlavors: "Підтверджені смаки",
    addFlavor: "Додати смак",
    addLocation: "Додати місце",
    verify: "Підтвердити",
    unverify: "Зняти підтвердження",
    verified: "Підтверджено",
    delete: "Видалити",
    noFlavors: "Ще немає підтверджених смаків.",
    fromYou: (d, u) => `${d} ${u} від вас`,
    searchLocation: "Пошук місця...",
    locationName: "Назва місця",
    city: "Місто",
    country: "Країна",
    price: "Ціна",
    currency: "Валюта",
    save: "Зберегти місце",
    saving: "Збереження...",
    cancel: "Скасувати",
    addedByLabel: "Додав",
  },
  friends: {
    title: "Друзі",
    subtitle: "Спілкуйся з іншими колекціонерами.",
    addFriend: "Додати друга",
    searchUser: "Знайти користувача",
    usernamePlaceholder: "нікнейм",
    yourFriends: "Ваші друзі",
    noFriendsYet: "Ще немає друзів",
    noFriendsHint: "Шукай користувачів за нікнеймом, щоб додати їх.",
    alreadyFriends: "Вже друзі",
    viewCollection: "Колекція",
    removeFriend: "Видалити друга",
    friendAdded: "Друга додано!",
    friendRemoved: "Друга видалено.",
    userNotFound: "Користувача не знайдено.",
    thatsYou: "Це ти!",
    caughtOf: (c, t) => `${c} / ${t} зловлено`,
    collectionOf: (n) => `Колекція ${n}`,
    nothingCaught: "Ще нічого не зловлено!",
  },
  account: {
    title: "Акаунт",
    subtitle: "Твій профіль колекціонера.",
    caught: "Зловлено",
    totalFlavors: "Всього смаків",
    collectionProgress: "Прогрес колекції",
    signOut: "Вийти",
    signOutDesc: "Твоя колекція збережена в хмарі і буде тут, коли ти повернешся.",
    signOutButton: "Вийти",
    save: "Збережено!",
    notLoggedIn: "Не увійшов до системи.",
  },
  leaderboard: {
    title: "Рейтинг",
    subtitle: "Найкращі колекціонери світу.",
    rank: "Місце",
    collector: "Колекціонер",
    caughtCount: "Зловлено",
    progress: "Прогрес",
    you: "Ти",
    yourRank: "Твоє місце",
    noEntries: "Ще немає — будь першим!",
    beFirst: "Почни колекцію, щоб з'явитись тут.",
    caughtOf: (c, t) => `${c} / ${t}`,
  },
};

const zh: Translations = {
  nav: {
    home: "主页",
    catch: "捕获",
    collection: "收藏",
    map: "地图",
    friends: "好友",
    account: "账户",
    leaderboard: "排行榜",
  },
  home: {
    welcomeBack: "欢迎回来！",
    welcomeBackName: (name) => `${name}，欢迎回来！`,
    readyToCatch: "今天准备收集一些碳酸饮料口味吗？",
    quickCatch: "快速查找",
    quickCatchPlaceholder: "输入或粘贴条形码...",
    catch: "查找",
    collectionProgress: "收藏进度",
    snackSpotsFound: "发现的零食地点",
    worldwide: "全球",
    recentlyCaught: "最近捕获",
    viewAll: "查看全部",
    noCaughtYet: "还没有捕获任何口味！",
    startCollection: "扫描第一瓶开始你的收藏。",
    scanBarcode: "扫描条形码",
    caughtOf: (c, t) => `${c} / ${t} 已捕获`,
    leaderboard: "排行榜",
    noCatches: "还没有捕获 — 成为第一个！",
  },
  collection: {
    title: "我的收藏",
    subtitle: (c, t) => `你已捕获 ${c} / ${t} 种口味。`,
    loading: "加载收藏中...",
    searchPlaceholder: "按名称或条形码搜索...",
    all: "全部",
    caught: "已捕获",
    uncaught: "未捕获",
    scanToCatch: "扫描捕获 →",
    noFlavorsFound: "未找到口味",
    tryDifferent: "请尝试不同的搜索或筛选。",
    removeFromCollection: "从收藏中移除",
    catchIt: "捕获！",
    inYourCollection: "已在收藏中",
    brand: "品牌",
    barcode: "条形码",
    editBarcode: "编辑条形码",
    addBarcode: "添加条形码",
    manageBarcode: "管理条形码",
    done: "完成",
    primary: "主要",
    alternates: "备用",
    addAlternate: "添加备用...",
  },
  catch: {
    title: "捕获口味",
    subtitle: "扫描你的拉姆内瓶上的 JAN/EAN 条形码。",
    cameraScanner: "摄像头扫描",
    manualEntry: "手动输入",
    enterBarcode: "输入条形码号码...",
    lookUp: "查找",
    barcodePreview: "条形码预览",
    lookingUp: "正在查询数据库...",
    inDatabase: "已在数据库中",
    catchIt: "捕获！",
    cancel: "取消",
    alreadyInCollection: "已在你的收藏中！",
    newFlavor: "新口味！",
    newFlavorDesc: (b) => `条形码 ${b} 还不在数据库中。命名并添加它！`,
    jpName: "日文名（瓶身上）",
    jpNamePlaceholder: "例：メロンラムネ",
    enName: "英文名",
    enNamePlaceholder: "例：Melon Ramune",
    category: "类别",
    color: "颜色",
    saveAndCatch: "保存并捕获！",
    manageBarcodes: "管理条形码",
  },
  map: {
    title: "零食地图",
    subtitle: "在附近找到拉姆内并分享你的发现。",
    addedBy: (u) => `由 @${u} 添加`,
    confirmedFlavors: "已确认口味",
    addFlavor: "添加口味",
    addLocation: "添加地点",
    verify: "验证",
    unverify: "取消验证",
    verified: "已验证",
    delete: "删除",
    noFlavors: "还没有确认的口味。",
    fromYou: (d, u) => `距你 ${d} ${u}`,
    searchLocation: "搜索地点...",
    locationName: "地点名称",
    city: "城市",
    country: "国家",
    price: "价格",
    currency: "货币",
    save: "保存地点",
    saving: "保存中...",
    cancel: "取消",
    addedByLabel: "添加者",
  },
  friends: {
    title: "好友",
    subtitle: "与其他收藏家交流。",
    addFriend: "添加好友",
    searchUser: "搜索用户",
    usernamePlaceholder: "用户名",
    yourFriends: "我的好友",
    noFriendsYet: "还没有好友",
    noFriendsHint: "按用户名搜索用户来添加他们。",
    alreadyFriends: "已是好友",
    viewCollection: "收藏",
    removeFriend: "删除好友",
    friendAdded: "好友已添加！",
    friendRemoved: "好友已删除。",
    userNotFound: "未找到用户。",
    thatsYou: "那是你！",
    caughtOf: (c, t) => `${c} / ${t} 已捕获`,
    collectionOf: (n) => `${n} 的收藏`,
    nothingCaught: "还没有捕获任何口味！",
  },
  account: {
    title: "账户",
    subtitle: "你的收藏家档案。",
    caught: "已捕获",
    totalFlavors: "口味总数",
    collectionProgress: "收藏进度",
    signOut: "退出登录",
    signOutDesc: "你的收藏已保存到云端，重新登录时还会在这里。",
    signOutButton: "退出登录",
    save: "已保存！",
    notLoggedIn: "未登录。",
  },
  leaderboard: {
    title: "排行榜",
    subtitle: "全球顶级收藏家。",
    rank: "排名",
    collector: "收藏家",
    caughtCount: "已捕获",
    progress: "进度",
    you: "你",
    yourRank: "你的排名",
    noEntries: "还没有捕获 — 成为第一个！",
    beFirst: "开始你的收藏以出现在这里。",
    caughtOf: (c, t) => `${c} / ${t}`,
  },
};

const kr: Translations = {
  nav: {
    home: "홈",
    catch: "포획",
    collection: "컬렉션",
    map: "지도",
    friends: "친구",
    account: "계정",
    leaderboard: "리더보드",
  },
  home: {
    welcomeBack: "돌아오셨네요!",
    welcomeBackName: (name) => `${name}님, 돌아오셨네요!`,
    readyToCatch: "오늘도 라무네 맛을 모아볼까요?",
    quickCatch: "빠른 포획",
    quickCatchPlaceholder: "바코드를 입력하세요...",
    catch: "검색",
    collectionProgress: "컬렉션 진행도",
    snackSpotsFound: "발견한 스낵 스팟",
    worldwide: "전 세계",
    recentlyCaught: "최근 포획",
    viewAll: "전체 보기",
    noCaughtYet: "아직 포획한 맛이 없어요!",
    startCollection: "첫 번째 병을 스캔해서 컬렉션을 시작하세요.",
    scanBarcode: "바코드 스캔",
    caughtOf: (c, t) => `${c} / ${t} 포획`,
    leaderboard: "리더보드",
    noCatches: "아직 포획 없음 — 첫 번째가 되세요!",
  },
  collection: {
    title: "내 컬렉션",
    subtitle: (c, t) => `${t}개 중 ${c}개를 포획했어요.`,
    loading: "컬렉션 로딩 중...",
    searchPlaceholder: "이름이나 바코드로 검색...",
    all: "전체",
    caught: "포획됨",
    uncaught: "미포획",
    scanToCatch: "스캔해서 포획 →",
    noFlavorsFound: "맛을 찾을 수 없음",
    tryDifferent: "다른 검색어나 필터를 사용해보세요.",
    removeFromCollection: "컬렉션에서 제거",
    catchIt: "포획!",
    inYourCollection: "컬렉션에 있음",
    brand: "브랜드",
    barcode: "바코드",
    editBarcode: "바코드 수정",
    addBarcode: "바코드 추가",
    manageBarcode: "바코드 관리",
    done: "완료",
    primary: "기본",
    alternates: "대체",
    addAlternate: "대체 추가...",
  },
  catch: {
    title: "맛 포획",
    subtitle: "라무네 병의 JAN/EAN 바코드를 스캔하세요.",
    cameraScanner: "카메라 스캐너",
    manualEntry: "직접 입력",
    enterBarcode: "바코드 번호 입력...",
    lookUp: "검색",
    barcodePreview: "바코드 미리보기",
    lookingUp: "데이터베이스 검색 중...",
    inDatabase: "데이터베이스에 있음",
    catchIt: "포획!",
    cancel: "취소",
    alreadyInCollection: "이미 컬렉션에 있어요!",
    newFlavor: "새로운 맛!",
    newFlavorDesc: (b) => `바코드 ${b}는 아직 데이터베이스에 없어요. 이름을 붙이고 추가하세요!`,
    jpName: "일본어 이름 (병에 표시된)",
    jpNamePlaceholder: "예: メロンラムネ",
    enName: "영어 이름",
    enNamePlaceholder: "예: Melon Ramune",
    category: "카테고리",
    color: "색상",
    saveAndCatch: "저장 후 포획!",
    manageBarcodes: "바코드 관리",
  },
  map: {
    title: "스낵 지도",
    subtitle: "근처의 라무네를 찾고 발견을 공유하세요.",
    addedBy: (u) => `@${u}가 추가함`,
    confirmedFlavors: "확인된 맛",
    addFlavor: "맛 추가",
    addLocation: "위치 추가",
    verify: "인증",
    unverify: "인증 해제",
    verified: "인증됨",
    delete: "삭제",
    noFlavors: "아직 확인된 맛이 없어요.",
    fromYou: (d, u) => `당신으로부터 ${d} ${u}`,
    searchLocation: "장소 검색...",
    locationName: "위치 이름",
    city: "도시",
    country: "국가",
    price: "가격",
    currency: "통화",
    save: "위치 저장",
    saving: "저장 중...",
    cancel: "취소",
    addedByLabel: "추가자",
  },
  friends: {
    title: "친구",
    subtitle: "다른 수집가와 연결하세요.",
    addFriend: "친구 추가",
    searchUser: "사용자 검색",
    usernamePlaceholder: "사용자명",
    yourFriends: "내 친구",
    noFriendsYet: "아직 친구가 없어요",
    noFriendsHint: "사용자명으로 사용자를 검색해서 추가하세요.",
    alreadyFriends: "이미 친구입니다",
    viewCollection: "컬렉션",
    removeFriend: "친구 삭제",
    friendAdded: "친구가 추가되었어요!",
    friendRemoved: "친구가 삭제되었어요.",
    userNotFound: "사용자를 찾을 수 없어요.",
    thatsYou: "그건 당신이에요!",
    caughtOf: (c, t) => `${c} / ${t} 포획`,
    collectionOf: (n) => `${n}의 컬렉션`,
    nothingCaught: "아직 포획한 것이 없어요!",
  },
  account: {
    title: "계정",
    subtitle: "내 수집가 프로필.",
    caught: "포획됨",
    totalFlavors: "전체 맛",
    collectionProgress: "컬렉션 진행도",
    signOut: "로그아웃",
    signOutDesc: "컬렉션은 클라우드에 저장되어 있어 다시 로그인하면 그대로 있어요.",
    signOutButton: "로그아웃",
    save: "저장됨!",
    notLoggedIn: "로그인되지 않았습니다.",
  },
  leaderboard: {
    title: "리더보드",
    subtitle: "전 세계 최고의 수집가.",
    rank: "순위",
    collector: "수집가",
    caughtCount: "포획",
    progress: "진행도",
    you: "나",
    yourRank: "내 순위",
    noEntries: "아직 포획 없음 — 첫 번째가 되세요!",
    beFirst: "여기에 등장하려면 컬렉션을 시작하세요.",
    caughtOf: (c, t) => `${c} / ${t}`,
  },
};

export const translations: Record<Language, Translations> = { en, jp, ua, zh, kr };
