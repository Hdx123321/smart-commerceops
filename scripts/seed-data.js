// Seed script: 5 merchants + 100 products
// Usage: node scripts/seed-data.js
const BASE = process.env.API_BASE || 'http://localhost:8090';

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function put(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function login(username, password) {
  return post('/auth/login', { username, password });
}

async function register(username, email, password, role) {
  return post('/auth/register', { username, email, password, role });
}

const MERCHANTS = [
  { username: 'digi_pioneer',  email: 'digi@shop.local',   password: 'merchant123', merchantName: '数码先锋', merchantDescription: '智能数码产品专卖 — 手机、电脑、平板、耳机，科技改变生活', merchantContact: '010-1001-0001', merchantAddress: '北京市海淀区中关村大街1号' },
  { username: 'fashion_closet', email: 'fashion@shop.local', password: 'merchant123', merchantName: '时尚衣橱', merchantDescription: '潮流服饰精选 — 男装、女装、配饰，穿出你的态度', merchantContact: '010-1002-0002', merchantAddress: '上海市静安区南京西路1888号' },
  { username: 'tasty_life',    email: 'tasty@shop.local',   password: 'merchant123', merchantName: '美味生活', merchantDescription: '进口零食 · 精品咖啡 · 健康食材，舌尖上的品质生活', merchantContact: '010-1003-0003', merchantAddress: '广州市天河区体育西路3号' },
  { username: 'home_boutique', email: 'home@shop.local',    password: 'merchant123', merchantName: '家居精品', merchantDescription: '北欧简约 · 日式禅意 · 现代轻奢，把家变成理想空间', merchantContact: '010-1004-0004', merchantAddress: '成都市高新区天府大道4号' },
  { username: 'sports_pro',    email: 'sports@shop.local',  password: 'merchant123', merchantName: '运动达人', merchantDescription: '专业运动装备 — 跑步、健身、瑜伽、户外，你的运动伙伴', merchantContact: '010-1005-0005', merchantAddress: '深圳市南山区科技南路5号' },
];

// 20 products per merchant, organized by category
const PRODUCT_TEMPLATES = [
  // ---- Electronics (数码先锋) ----
  { merchant: 0, category: 'Electronics', name: '无线蓝牙耳机 Pro', price: 299.00, stock: 150, threshold: 20, desc: '主动降噪｜36小时续航｜IPX5防水｜Type-C快充，通勤运动两相宜' },
  { merchant: 0, category: 'Electronics', name: '27寸4K显示器', price: 2499.00, stock: 40, threshold: 5, desc: 'IPS面板｜3840×2160｜HDR400｜Type-C 65W反向充电，设计师专用' },
  { merchant: 0, category: 'Electronics', name: '机械键盘红轴', price: 399.00, stock: 200, threshold: 15, desc: 'Cherry MX红轴｜RGB背光｜PBT键帽｜热插拔，电竞办公皆可' },
  { merchant: 0, category: 'Electronics', name: 'Type-C扩展坞 12合1', price: 259.00, stock: 120, threshold: 10, desc: '双HDMI｜千兆网口｜SD/TF读卡｜PD 100W，轻薄本必备' },
  { merchant: 0, category: 'Electronics', name: '智能手表 S3', price: 899.00, stock: 80, threshold: 10, desc: '1.5寸AMOLED｜心率血氧监测｜GPS｜IP68｜7天续航' },
  { merchant: 0, category: 'Electronics', name: '无线充电板 15W', price: 99.00, stock: 300, threshold: 30, desc: 'Qi认证｜双线圈｜支持iPhone/安卓｜LED指示灯' },
  { merchant: 0, category: 'Electronics', name: '便携蓝牙音箱', price: 199.00, stock: 100, threshold: 10, desc: '20W大功率｜IPX7防水｜TWS串联｜12小时续航' },
  { merchant: 0, category: 'Electronics', name: 'USB-C快充头 65W', price: 129.00, stock: 250, threshold: 20, desc: 'GaN氮化镓｜双口输出｜支持PD3.0/QC4+｜折叠插脚' },
  { merchant: 0, category: 'Electronics', name: '高清摄像头 1080P', price: 349.00, stock: 90, threshold: 10, desc: '自动对焦｜双麦克降噪｜物理隐私盖｜即插即用' },
  { merchant: 0, category: 'Electronics', name: '平板支架 铝合金', price: 159.00, stock: 180, threshold: 15, desc: '全金属｜360°旋转｜高度可调｜支持iPad/Surface' },
  { merchant: 0, category: 'Electronics', name: '电竞鼠标 16000DPI', price: 249.00, stock: 130, threshold: 10, desc: 'PMW3389传感器｜8个可编程按键｜RGB流光｜伞绳线' },
  { merchant: 0, category: 'Electronics', name: '笔记本电脑散热架', price: 89.00, stock: 160, threshold: 15, desc: '6风扇｜6档高度调节｜双USB扩展｜静音设计' },
  { merchant: 0, category: 'Electronics', name: '移动电源 20000mAh', price: 179.00, stock: 200, threshold: 20, desc: '22.5W快充｜三输出口｜LED数显｜可上飞机' },
  { merchant: 0, category: 'Electronics', name: '降噪麦克风 USB', price: 459.00, stock: 60, threshold: 8, desc: '心形指向｜24bit/96kHz｜一键静音｜兼容PC/Mac' },
  { merchant: 0, category: 'Electronics', name: '智能插座 WiFi版', price: 79.00, stock: 300, threshold: 25, desc: 'APP远程控制｜定时开关｜电量统计｜语音控制' },
  { merchant: 0, category: 'Electronics', name: 'HDMI线 8K 2米', price: 69.00, stock: 400, threshold: 30, desc: 'HDMI 2.1｜48Gbps｜支持8K@60Hz｜编织线材' },
  { merchant: 0, category: 'Electronics', name: '桌面LED护眼灯', price: 219.00, stock: 110, threshold: 10, desc: '无频闪｜Ra>95｜色温可调｜记忆亮度｜USB充电' },
  { merchant: 0, category: 'Electronics', name: '手机云台稳定器', price: 699.00, stock: 45, threshold: 5, desc: '三轴防抖｜AI追踪｜折叠便携｜支持原生相机' },
  { merchant: 0, category: 'Electronics', name: '路由器 AX5400', price: 499.00, stock: 70, threshold: 8, desc: 'WiFi6｜5400Mbps｜OFDMA｜160MHz｜Mesh组网' },
  { merchant: 0, category: 'Electronics', name: '数位板 10x6寸', price: 329.00, stock: 55, threshold: 5, desc: '8192级压感｜Type-C接口｜兼容PS/AI/Sai｜送笔座' },

  // ---- Apparel (时尚衣橱) ----
  { merchant: 1, category: 'Apparel', name: '纯棉宽松T恤 男女同款', price: 89.00, stock: 500, threshold: 50, desc: '100%新疆长绒棉｜250g重磅｜不变形不缩水｜12色可选' },
  { merchant: 1, category: 'Apparel', name: '轻薄羽绒服 90%白鸭绒', price: 599.00, stock: 150, threshold: 20, desc: '蓬松度700+｜防风防泼水｜可收纳至收纳袋｜男女同款' },
  { merchant: 1, category: 'Apparel', name: '直筒牛仔裤 弹力面料', price: 259.00, stock: 200, threshold: 20, desc: '98%棉+2%氨纶｜微弹不紧绷｜经典五袋款｜修身直筒' },
  { merchant: 1, category: 'Apparel', name: '帆布鞋 经典低帮', price: 169.00, stock: 300, threshold: 30, desc: '天然橡胶大底｜透气帆布鞋面｜加厚鞋垫｜百搭黑白' },
  { merchant: 1, category: 'Apparel', name: '羊毛混纺针织衫', price: 329.00, status: 'active', stock: 180, threshold: 15, desc: '美利奴羊毛混纺｜柔软亲肤｜圆领套头｜商务休闲两穿' },
  { merchant: 1, category: 'Apparel', name: '防晒皮肤衣 UPF50+', price: 139.00, stock: 250, threshold: 25, desc: 'UPF50+防紫外线｜超轻100g｜透气速干｜可收纳口袋' },
  { merchant: 1, category: 'Apparel', name: '束脚运动裤 春秋款', price: 149.00, stock: 220, threshold: 20, desc: '四面弹力面料｜深层透气｜锥形束脚｜侧拉链口袋' },
  { merchant: 1, category: 'Apparel', name: '真丝围巾 100%桑蚕丝', price: 199.00, stock: 100, threshold: 10, desc: '14姆米真丝｜手工卷边｜数码印花｜优雅百搭' },
  { merchant: 1, category: 'Apparel', name: '牛皮腰带 头层牛皮', price: 179.00, stock: 150, threshold: 15, desc: '意大利头层牛皮｜锌合金扣头｜可裁剪长度｜礼盒装' },
  { merchant: 1, category: 'Apparel', name: '纯棉睡衣套装 男女款', price: 199.00, stock: 180, threshold: 15, desc: '100%纯棉｜柔软亲肤｜宽松版型｜四季通用' },
  { merchant: 1, category: 'Apparel', name: '冲锋衣 三合一', price: 899.00, stock: 80, threshold: 8, desc: 'GORE-TEX防水｜可拆卸内胆｜防风透气｜户外必备' },
  { merchant: 1, category: 'Apparel', name: '商务衬衫 免烫牛津纺', price: 239.00, stock: 200, threshold: 20, desc: '80支双股｜液氨免烫｜修身版型｜温感纽扣' },
  { merchant: 1, category: 'Apparel', name: '瑜伽裤 高腰提臀', price: 159.00, stock: 250, threshold: 25, desc: 'Nulu面料｜四向弹力｜隐藏口袋｜不透视' },
  { merchant: 1, category: 'Apparel', name: '毛呢大衣 双面呢', price: 1299.00, stock: 40, threshold: 5, desc: '澳洲美利奴羊毛｜手工缝制｜双面可穿｜经典翻领' },
  { merchant: 1, category: 'Apparel', name: '运动文胸 高强度支撑', price: 189.00, stock: 180, threshold: 15, desc: '速干面料｜工字背设计｜可拆卸胸垫｜适合高强度运动' },
  { merchant: 1, category: 'Apparel', name: '棉麻阔腿裤 夏季薄款', price: 139.00, stock: 200, threshold: 20, desc: '55%亚麻+45%棉｜透气凉爽｜高腰松紧｜垂感十足' },
  { merchant: 1, category: 'Apparel', name: '老爹鞋 复古厚底', price: 349.00, stock: 150, threshold: 15, desc: '网面+皮革拼接｜EVA发泡中底｜增高4cm｜轻便舒适' },
  { merchant: 1, category: 'Apparel', name: '鸭舌帽 纯棉棒球帽', price: 59.00, stock: 400, threshold: 40, desc: '100%纯棉｜可调节头围｜透气孔设计｜字母刺绣' },
  { merchant: 1, category: 'Apparel', name: '中筒袜 精梳棉 5双装', price: 49.00, stock: 500, threshold: 50, desc: '新疆长绒棉｜200针高密编织｜防臭抗菌｜均码' },
  { merchant: 1, category: 'Apparel', name: '双肩包 大容量旅行', price: 279.00, stock: 120, threshold: 10, desc: '防泼水尼龙｜40L大容量｜USB充电口｜TSA密码锁' },

  // ---- Groceries (美味生活) ----
  { merchant: 2, category: 'Groceries', name: '埃塞俄比亚 耶加雪菲 咖啡豆 250g', price: 89.00, stock: 300, threshold: 30, desc: 'G1级｜浅度烘焙｜花香柑橘调｜产地直供' },
  { merchant: 2, category: 'Groceries', name: '比利时黑巧克力 72%可可', price: 59.00, stock: 200, threshold: 20, desc: '纯可可脂｜无代可可脂｜72%可可含量｜100g*2块' },
  { merchant: 2, category: 'Groceries', name: '有机抹茶粉 京都宇治 100g', price: 129.00, stock: 150, threshold: 15, desc: '石磨研磨｜特A级｜无添加｜适合烘焙和茶道' },
  { merchant: 2, category: 'Groceries', name: '加州巴旦木 烤盐味 500g', price: 79.00, stock: 250, threshold: 25, desc: '加州原产｜低温烘烤｜海盐轻调｜非油炸' },
  { merchant: 2, category: 'Groceries', name: '意大利初榨橄榄油 1L', price: 169.00, stock: 150, threshold: 15, desc: '100%特级初榨｜冷压工艺｜酸度<0.5%｜原瓶进口' },
  { merchant: 2, category: 'Groceries', name: '云南普洱茶 熟茶饼 357g', price: 259.00, stock: 100, threshold: 10, desc: '2018年古树茶｜勐海发酵｜陈香糯滑｜越陈越香' },
  { merchant: 2, category: 'Groceries', name: '日本白桃乌龙茶 50g', price: 79.00, stock: 180, threshold: 15, desc: '台湾冻顶乌龙+日本白桃｜无香精｜冷泡热泡两相宜' },
  { merchant: 2, category: 'Groceries', name: '新西兰麦卢卡蜂蜜 MGO115+ 250g', price: 259.00, stock: 80, threshold: 10, desc: 'UMF6+｜MGO115+｜纯天然｜新西兰原装进口' },
  { merchant: 2, category: 'Groceries', name: '韩国海苔脆片 原味 18包', price: 39.00, stock: 400, threshold: 40, desc: '传统韩式烘烤｜非油炸｜低脂健康｜独立小包装' },
  { merchant: 2, category: 'Groceries', name: '有机藜麦 玻利维亚 1kg', price: 69.00, stock: 200, threshold: 20, desc: '三色藜麦｜高蛋白｜无麸质｜安第斯高原有机认证' },
  { merchant: 2, category: 'Groceries', name: '法国布列塔尼黄油饼干 150g', price: 49.00, stock: 250, threshold: 25, desc: 'AOP认证发酵黄油｜手工烘焙｜传统配方｜酥脆香浓' },
  { merchant: 2, category: 'Groceries', name: '四川大红袍花椒 100g', price: 39.00, stock: 300, threshold: 30, desc: '四川汉源产｜头茬新货｜麻香浓郁｜火锅炒菜必备' },
  { merchant: 2, category: 'Groceries', name: '意大利番茄罐头 400g*2', price: 35.00, stock: 300, threshold: 30, desc: '圣马尔扎诺番茄｜DOP认证｜去皮整颗｜意面灵魂' },
  { merchant: 2, category: 'Groceries', name: '马来西亚白咖啡 速溶 20条', price: 59.00, stock: 200, threshold: 20, desc: '阿拉比卡豆｜低温烘焙｜不酸不苦｜独立包装' },
  { merchant: 2, category: 'Groceries', name: '希腊酸奶 原味 1kg', price: 59.00, stock: 100, threshold: 10, desc: '纯生牛乳发酵｜无添加糖｜蛋白质≥8%｜浓稠如奶酪' },
  { merchant: 2, category: 'Groceries', name: '东北五常大米 稻花香 5kg', price: 89.00, stock: 200, threshold: 20, desc: 'GB/T 19266｜五常核心产区｜当季新米｜软糯香甜' },
  { merchant: 2, category: 'Groceries', name: '澳洲安格斯牛排 谷饲200天 250g*2', price: 199.00, stock: 60, threshold: 8, desc: 'M3大理石纹｜真空锁鲜｜顺丰冷链｜煎烤俱佳' },
  { merchant: 2, category: 'Groceries', name: '有机枸杞 宁夏特级 200g', price: 49.00, stock: 250, threshold: 25, desc: '宁夏中宁原产｜粒大肉厚｜无硫熏｜泡水煲汤' },
  { merchant: 2, category: 'Groceries', name: '日本酱油 丸大豆酿造 500ml', price: 69.00, stock: 200, threshold: 20, desc: '纯大豆酿造｜天然晾晒｜无添加味精｜日料必备' },
  { merchant: 2, category: 'Groceries', name: '越南腰果 盐焗味 500g', price: 69.00, stock: 200, threshold: 20, desc: 'A180级大果｜原产越南平福｜低温烘焙｜酥脆饱满' },

  // ---- Home (家居精品) ----
  { merchant: 3, category: 'Home', name: '香薰蜡烛 大豆蜡 无烟', price: 89.00, stock: 300, threshold: 30, desc: '100%大豆蜡｜天然精油｜燃烧40小时｜白茉莉花香' },
  { merchant: 3, category: 'Home', name: '双层玻璃杯 隔热 350ml', price: 69.00, stock: 400, threshold: 40, desc: '高硼硅玻璃｜手工吹制｜双层隔热不烫手｜茶水分离' },
  { merchant: 3, category: 'Home', name: '记忆棉枕头 慢回弹', price: 259.00, stock: 150, threshold: 15, desc: '太空慢回弹记忆棉｜人体工学｜透气枕套｜颈椎养护' },
  { merchant: 3, category: 'Home', name: '北欧风陶瓷花瓶 三件套', price: 129.00, stock: 200, threshold: 20, desc: '磨砂釉面｜简约设计｜不同尺寸｜客厅餐桌百搭' },
  { merchant: 3, category: 'Home', name: '全棉浴巾 600GSM 两条装', price: 169.00, stock: 200, threshold: 20, desc: '32支精梳棉｜600GSM加厚｜瞬吸速干｜不掉毛' },
  { merchant: 3, category: 'Home', name: '智能垃圾桶 感应开盖 12L', price: 199.00, stock: 150, threshold: 15, desc: '红外感应｜0.3秒开盖｜密封防臭｜充电款续航3月' },
  { merchant: 3, category: 'Home', name: '日式榻榻米地垫 60x60cm 4片', price: 139.00, stock: 180, threshold: 15, desc: '天然蔺草编织｜防潮防虫｜可拼接｜四季通用' },
  { merchant: 3, category: 'Home', name: '幻彩星空投影灯', price: 89.00, stock: 200, threshold: 20, desc: '多色变换｜蓝牙音乐｜定时关闭｜儿童房/卧室' },
  { merchant: 3, category: 'Home', name: '不锈钢置物架 厨房三层', price: 199.00, stock: 120, threshold: 10, desc: '304不锈钢｜承重50kg｜高度可调｜防滑脚垫' },
  { merchant: 3, category: 'Home', name: '遮光窗帘 隔热防晒 1.4x2.4m', price: 149.00, stock: 150, threshold: 15, desc: '100%遮光｜物理隔热｜降噪20dB｜打孔安装' },
  { merchant: 3, category: 'Home', name: '乳胶坐垫 办公室久坐', price: 99.00, stock: 250, threshold: 25, desc: '泰国天然乳胶｜蜂窝透气｜矫正坐姿｜可拆洗' },
  { merchant: 3, category: 'Home', name: '超声波香薰加湿器 300ml', price: 159.00, stock: 150, threshold: 15, desc: '3L大容量｜静音30dB｜7色氛围灯｜自动断电' },
  { merchant: 3, category: 'Home', name: '实木砧板 黑胡桃木', price: 199.00, stock: 100, threshold: 10, desc: '北美黑胡桃木｜整木无拼接｜食品级木蜡油｜40x28cm' },
  { merchant: 3, category: 'Home', name: '浴室防滑垫 硅藻泥', price: 79.00, stock: 300, threshold: 30, desc: '天然硅藻土｜5秒吸水｜防霉抗菌｜可水洗打磨' },
  { merchant: 3, category: 'Home', name: '多功能电煮锅 1.5L', price: 159.00, stock: 200, threshold: 20, desc: '不粘涂层｜600W功率｜蒸煮煎涮四合一｜宿舍神器' },
  { merchant: 3, category: 'Home', name: '轻奢挂钟 静音 12寸', price: 129.00, stock: 150, threshold: 15, desc: '金属拉丝表盘｜静音机芯｜简约现代｜客厅书房' },
  { merchant: 3, category: 'Home', name: '磁吸冰箱收纳架 三层', price: 89.00, stock: 250, threshold: 25, desc: '强力磁吸｜免打孔｜304不锈钢｜承重10kg' },
  { merchant: 3, category: 'Home', name: '纯棉四件套 60支长绒棉', price: 499.00, stock: 100, threshold: 10, desc: '60支长绒棉｜400T密度｜丝滑触感｜活性印染' },
  { merchant: 3, category: 'Home', name: '自动感应洗手液机 300ml', price: 99.00, stock: 200, threshold: 20, desc: '红外感应｜0.25秒出泡｜IPX5防水｜Type-C充电' },
  { merchant: 3, category: 'Home', name: '北欧落地灯 客厅简约', price: 599.00, stock: 60, threshold: 5, desc: '实木灯杆｜亚麻灯罩｜三档调光｜暖白光LED' },

  // ---- Lifestyle (运动达人) ----
  { merchant: 4, category: 'Lifestyle', name: '专业跑步鞋 男女同款', price: 599.00, stock: 150, threshold: 15, desc: '全掌碳板｜超临界发泡中底｜透气飞织鞋面｜回弹率80%+' },
  { merchant: 4, category: 'Lifestyle', name: '瑜伽垫 TPE 6mm加厚', price: 149.00, stock: 300, threshold: 30, desc: 'TPE环保材质｜双面防滑｜体位线导航｜送收纳绑带' },
  { merchant: 4, category: 'Lifestyle', name: '可调节哑铃 25kg*2', price: 899.00, stock: 80, threshold: 8, desc: '25档快调｜2.5-25kg｜铸铁材质｜替换15对哑铃' },
  { merchant: 4, category: 'Lifestyle', name: '筋膜枪 专业级按摩枪', price: 399.00, stock: 120, threshold: 10, desc: '无刷电机｜16mm深度｜6档变速｜6个按摩头' },
  { merchant: 4, category: 'Lifestyle', name: '运动水壶 不锈钢 750ml', price: 99.00, stock: 300, threshold: 30, desc: '316不锈钢｜24h保温12h保冷｜单手开盖｜防漏设计' },
  { merchant: 4, category: 'Lifestyle', name: '阻力带套装 5件套', price: 69.00, stock: 400, threshold: 40, desc: '天然乳胶｜5种阻力级别｜送收纳袋和训练指南' },
  { merchant: 4, category: 'Lifestyle', name: '健腹轮 自动回弹', price: 79.00, stock: 250, threshold: 25, desc: '双轮稳定设计｜智能回弹辅助｜静音轴承｜核心训练' },
  { merchant: 4, category: 'Lifestyle', name: '骑行头盔 带磁吸风镜', price: 329.00, stock: 100, threshold: 10, desc: 'PC+EPS一体成型｜磁吸风镜｜27孔通风｜MIPS防护' },
  { merchant: 4, category: 'Lifestyle', name: '蛋白粉 乳清蛋白 巧克力味 2.27kg', price: 329.00, stock: 80, threshold: 10, desc: '分离乳清｜每份25g蛋白质｜低脂低碳水｜进口原料' },
  { merchant: 4, category: 'Lifestyle', name: '跳绳 钢丝竞速绳', price: 49.00, stock: 400, threshold: 40, desc: '钢丝绳芯｜PVC包裹｜铝合金手柄｜防滑吸汗' },
  { merchant: 4, category: 'Lifestyle', name: '运动护膝 髌骨带 两只装', price: 59.00, stock: 300, threshold: 30, desc: '3D环形加压｜硅胶防滑条｜透气排汗｜跑步篮球适用' },
  { merchant: 4, category: 'Lifestyle', name: '仰卧起坐辅助器 吸盘式', price: 89.00, stock: 200, threshold: 20, desc: '强力吸盘｜多角度调节｜免打孔安装｜腹肌训练神器' },
  { merchant: 4, category: 'Lifestyle', name: '户外折叠椅 铝合金', price: 179.00, stock: 150, threshold: 15, desc: '7075铝合金｜承重150kg｜折叠便携｜送收纳袋' },
  { merchant: 4, category: 'Lifestyle', name: '游泳镜 防雾 近视可配', price: 129.00, stock: 200, threshold: 20, desc: '防雾涂层｜UV防护｜硅胶密封｜近视度数可选' },
  { merchant: 4, category: 'Lifestyle', name: '登山杖 碳纤维 超轻两根', price: 259.00, stock: 120, threshold: 10, desc: '3K碳纤维｜单根195g｜EVA握把｜7075杖尖' },
  { merchant: 4, category: 'Lifestyle', name: '跑步腰包 防水触控', price: 59.00, stock: 350, threshold: 35, desc: 'IPX6防水｜透明触控窗｜弹力贴合｜反光安全条' },
  { merchant: 4, category: 'Lifestyle', name: '瑜伽砖 EVA 高密度 2块', price: 39.00, stock: 350, threshold: 35, desc: '高密度EVA｜防滑表面｜9寸标准尺寸｜辅助体式' },
  { merchant: 4, category: 'Lifestyle', name: '智能体脂秤 WiFi版', price: 199.00, stock: 150, threshold: 15, desc: 'BIA生物电阻抗｜17项数据｜APP同步｜支持多人使用' },
  { merchant: 4, category: 'Lifestyle', name: '泡沫轴 深层放松 45cm', price: 89.00, stock: 200, threshold: 20, desc: '高密度EPP｜立体浮点｜承重200kg｜缓解肌肉酸痛' },
  { merchant: 4, category: 'Lifestyle', name: '运动速干毛巾 超细纤维', price: 39.00, stock: 400, threshold: 40, desc: '超细纤维｜3秒吸水｜抗菌防臭｜100x50cm加大加厚' },
];

function picUrl(productName, index) {
  // picsum seed gives a stable random image per name
  const seed = productName.replace(/[^a-zA-Z0-9一-鿿]/g, '').slice(0, 20) + index;
  // encode as simple hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  return `https://picsum.photos/seed/${Math.abs(hash) % 10000}/400/300`;
}

async function main() {
  console.log('=== Smart CommerceOps Seed Script ===\n');
  console.log(`API: ${BASE}\n`);

  // Step 1: Register 5 merchants
  console.log('--- Step 1: Registering 5 merchants ---');
  const merchants = [];
  for (const m of MERCHANTS) {
    try {
      const auth = await register(m.username, m.email, m.password, 'MERCHANT');
      console.log(`  ✓ ${m.username} registered (id=${auth.user.id})`);
      merchants.push({ ...m, auth });
    } catch (e) {
      if (e.message.includes('CONFLICT') || e.message.includes('409')) {
        console.log(`  ⚠ ${m.username} exists, logging in...`);
        const auth = await login(m.username, m.password);
        console.log(`  ✓ ${m.username} logged in (id=${auth.user.id})`);
        merchants.push({ ...m, auth });
      } else {
        console.error(`  ✗ ${m.username}: ${e.message}`);
      }
    }
  }

  // Step 2: Update merchant profiles
  console.log('\n--- Step 2: Updating merchant profiles ---');
  for (const m of merchants) {
    try {
      const profile = await put('/auth/me', {
        username: m.username,
        merchantName: m.merchantName,
        merchantDescription: m.merchantDescription,
        merchantContact: m.merchantContact,
        merchantAddress: m.merchantAddress,
      }, m.auth.accessToken);
      console.log(`  ✓ ${m.username} profile updated (merchantId=${profile.merchantId})`);
      m.profile = profile;
    } catch (e) {
      console.error(`  ✗ ${m.username} profile: ${e.message}`);
    }
  }

  // Step 3: Create 100 products
  console.log('\n--- Step 3: Creating 100 products ---');
  let totalCreated = 0;
  for (const t of PRODUCT_TEMPLATES) {
    const m = merchants[t.merchant];
    if (!m || !m.auth) continue;
    const productPayload = {
      name: t.name,
      category: t.category,
      description: t.desc,
      price: t.price,
      stockQuantity: t.stock,
      lowStockThreshold: t.threshold,
      active: t.status === 'inactive' ? false : true,
      imageUrls: [picUrl(t.name, 0), picUrl(t.name, 1)],
      merchantId: m.profile?.merchantId ?? m.auth.user.id,
      merchantName: m.merchantName,
      merchantDescription: m.merchantDescription,
      merchantContact: m.merchantContact,
    };
    try {
      await post('/admin/products', productPayload, m.auth.accessToken);
      totalCreated++;
    } catch (e) {
      if (e.message.includes('CONFLICT') || e.message.includes('409')) {
        console.log(`  ⚠ Duplicate: ${t.name} (skipped)`);
      } else {
        console.error(`  ✗ ${t.name}: ${e.message}`);
      }
    }
  }
  console.log(`  ✓ Created ${totalCreated} / ${PRODUCT_TEMPLATES.length} products`);

  // Summary
  console.log('\n=== Summary ===');
  console.log('Merchant accounts:');
  for (const m of merchants) {
    console.log(`  ${m.username} / ${m.password} — ${m.merchantName} (${m.merchantContact})`);
  }
  console.log(`\nProducts created: ${totalCreated}`);
  console.log('\nFrontend: http://localhost:3000');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
