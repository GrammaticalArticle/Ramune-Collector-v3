export type Language = "en" | "jp" | "ua";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "jp", label: "JP", flag: "🇯🇵" },
  { code: "ua", label: "UA", flag: "🇺🇦" },
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

export const translations: Record<Language, Translations> = { en, jp, ua };
