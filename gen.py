#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, random, sys, os

# Product templates by category
BEVERAGES = [
    ("可口可乐 经典罐装 330ml*24", "经典配方|含汽饮料|办公室家庭囤货装", 59, "coca cola classic can pack"),
    ("百事可乐 罐装 330ml*24", "清爽口感|含汽饮料|聚会必备", 55, "pepsi cola can pack"),
    ("雪碧 柠檬味 罐装 330ml*24", "柠檬风味|清爽解腻|冰镇更好喝", 55, "sprite lemon soda can"),
    ("芬达 橙味 罐装 330ml*24", "橙味碳酸饮料|果味汽水|夏日必备", 55, "fanta orange soda can"),
    ("美年达 葡萄味 罐装 330ml*24", "葡萄味碳酸饮料|果味浓郁", 55, "grape soda drink can"),
    ("七喜 柠檬汽水 罐装 330ml*24", "清爽柠檬味|无咖啡因|全家适用", 55, "7up lemon lime soda"),
    ("怡泉 苏打水 罐装 330ml*24", "无糖苏打水|0热量|调酒伴侣", 49, "schweppes soda water can"),
    ("元气森林 白桃味苏打气泡水 480ml*15", "0糖0脂0卡|白桃风味|代糖赤藓糖醇", 69, "sparkling water peach flavor bottle"),
    ("元气森林 卡曼橘味苏打气泡水 480ml*15", "卡曼橘味|清爽酸甜|网红气泡水", 69, "sparkling water citrus bottle"),
    ("农夫山泉 天然水 550ml*24", "天然水源|弱碱性水|日常饮用", 36, "bottled mineral water pack"),
    ("百岁山 天然矿泉水 570ml*24", "深层矿泉水|偏硅酸型|贵族品质", 48, "premium mineral water bottle"),
    ("依云 天然矿泉水 500ml*24", "法国阿尔卑斯山天然水源|进口高端水", 89, "evian mineral water bottle"),
    ("巴黎水 含气天然矿泉水 330ml*24", "法国进口|天然含气|西餐佐餐", 138, "perrier sparkling water glass"),
    ("圣培露 含气矿泉水 250ml*24", "意大利进口|细腻气泡|米其林餐厅用", 128, "san pellegrino sparkling water"),
    ("魔爪 能量饮料 罐装 355ml*12", "含牛磺酸咖啡因|电竞游戏|提神醒脑", 72, "monster energy drink can"),
    ("红牛 维生素功能饮料 250ml*24", "牛磺酸+咖啡因+维生素B族|加班提神", 129, "red bull energy drink can"),
    ("东鹏特饮 维生素饮料 500ml*15", "国产功能饮料|牛磺酸配方|运动后补充", 69, "energy drink bottle asian"),
    ("焕神 电解质饮料 西柚味 500ml*15", "电解质+维生素B|运动后补水|防脱水", 65, "electrolyte sports drink bottle"),
    ("宝矿力水特 电解质饮料 500ml*24", "日本进口|专业补水|发烧腹泻后补充", 96, "pocari sweat drink bottle"),
    ("维他柠檬茶 250ml*24", "港式柠檬茶|真茶+真柠檬|冷藏更佳", 55, "vita lemon tea drink carton"),
    # Tea
    ("三得利 无糖乌龙茶 500ml*15", "0糖0脂|武夷岩茶原料|日式工艺", 52, "suntory oolong tea bottle"),
    ("伊藤园 浓味绿茶 500ml*15", "日本第一茶饮品牌|浓郁抹茶风味", 58, "itoen green tea bottle"),
    ("东方树叶 茉莉花茶 500ml*15", "0糖0卡|真茶叶萃取|花香清新", 48, "jasmine green tea bottle"),
    ("东方树叶 红茶 500ml*15", "0糖0脂|真茶汤|醇厚甘甜", 48, "black tea bottle drink"),
    ("康师傅 冰红茶 500ml*15", "柠檬红茶味|冰镇饮用更佳|国民饮料", 45, "ice lemon tea bottle"),
    ("康师傅 冰糖雪梨 500ml*15", "雪梨汁+冰糖|秋冬润喉|温热可饮", 45, "pear juice drink bottle"),
    ("王老吉 凉茶 310ml*24", "草本凉茶|不上火|火锅烧烤绝配", 68, "herbal tea drink wong lo kat"),
    ("加多宝 凉茶 310ml*24", "三花三草一叶配方|国家级非遗", 65, "jiaduobao herbal tea can"),
    ("统一 阿萨姆奶茶 500ml*15", "印度阿萨姆红茶+进口奶源|丝滑口感", 52, "assam milk tea bottle"),
    ("香飘飘 原味奶茶 杯装 80g*30", "即冲即饮|办公室奶茶|冬日暖心", 69, "instant milk tea cup"),
    # Coffee
    ("雀巢 罐装咖啡 原味 240ml*24", "经典罐装|冷藏更佳|加班续命", 65, "nescafe canned coffee"),
    ("雀巢 金牌冻干速溶咖啡 200g", "冻干技术|即冲即溶|哥伦比亚豆", 89, "nescafe instant coffee jar"),
    ("星巴克 星冰乐 瓶装 281ml*12", "门店同款|摩卡风味|即饮咖啡", 156, "starbucks frappuccino bottled"),
    ("隅田川 冷萃咖啡液 10颗装", "日式冷萃|冷水即溶|醇苦不酸", 49, "cold brew coffee liquid japanese"),
    ("三顿半 精品速溶咖啡粉 3g*24颗", "冷热水即溶|数字系列|精品咖啡", 129, "specialty instant coffee capsules"),
    ("永璞 咖啡液 浓缩液 25g*8", "中国精品咖啡品牌|云南豆+国际豆拼配", 59, "coffee concentrate liquid"),
    ("瑞幸 冻干咖啡粉 3g*18颗", "门店同款烘焙|精品速溶|国货咖啡", 69, "luckin instant coffee powder"),
    ("麦斯威尔 速溶咖啡 100g*2", "经典美式速溶|醇厚口感|大容量装", 49, "maxwell house instant coffee"),
    ("UCC 117速溶咖啡 90g", "日本进口|深度烘焙|偏苦风味", 39, "ucc japanese instant coffee"),
    ("AGF Blendy 速溶咖啡 80g", "日本进口|柔和口感|适合兑牛奶", 45, "agf blendy instant coffee"),
    # Dairy
    ("德亚 高钙全脂纯牛奶 200ml*30", "德国进口|3.8g乳蛋白|高钙配方", 79, "whole milk carton full cream"),
    ("安佳 脱脂纯牛奶 250ml*24", "新西兰进口|0%脂肪|健身减脂", 85, "skim milk carton pack"),
    ("Oatly 燕麦奶 咖啡大师 1L*6", "瑞典进口|植物奶|拉花专用", 168, "oat milk barista edition carton"),
    ("维他 原味豆奶 250ml*24", "非转基因大豆|高蛋白|港式经典", 65, "soy milk vita drink pack"),
    ("宾格瑞 草莓味牛奶 200ml*12", "韩国进口|含真实果粒|童年回忆", 72, "korean flavored milk strawberry"),
    ("卡士 酸奶 原味 100g*18", "生牛乳发酵|活菌酸奶|儿童早餐", 55, "yogurt cup pack dairy"),
    ("蒙牛 纯甄 原味酸奶 200g*10", "丹麦菌种发酵|口感浓稠|送礼佳品", 59, "yogurt drink bottle pack"),
    ("乐纯 希腊酸奶 草莓味 135g*6", "三倍生牛乳浓缩|高蛋白|零脂肪", 52, "greek yogurt cup fruit"),
    ("露露 杏仁露 240ml*20", "河北承德特产|野生山杏仁|植物蛋白", 65, "almond milk drink chinese"),
    ("椰树 椰汁 245ml*24", "海南椰子鲜榨|国宴饮料", 69, "coconut juice drink can"),
]

ELECTRONICS = [
    # Phones & Accessories
    ("iPhone 15 Pro 钢化膜 2片装", "9H硬度|全屏覆盖|防指纹油污", 29, "iphone tempered glass screen protector"),
    ("iPhone 15 Pro Max 防摔手机壳", "军工级防摔|透明不发黄|MagSafe磁吸", 49, "iphone protective case clear magsafe"),
    ("三星 S24 Ultra 曲面钢化膜", "曲屏专用|UV光固化|全胶贴合", 39, "samsung screen protector film"),
    ("Type-C 快充数据线 100W 2米", "100W PD快充|尼龙编织|双Type-C", 25, "usb c fast charging cable braided"),
    ("MFi认证 苹果数据线 Lightning 1.5米", "苹果官方认证|兼容iPhone全系列|快充", 29, "apple lightning cable mfi certified"),
    ("无线充电器 三合一 手机+手表+耳机", "同时充三设备|MagSafe磁吸|床头必备", 89, "3 in 1 wireless charging station"),
    ("氮化镓GaN充电器 100W 四口", "2C+2A|笔记本手机平板通用|折叠插脚", 119, "gan charger 100w usb c fast"),
    ("车载手机支架 出风口磁吸款", "磁吸360度旋转|不挡出风口|稳固防抖", 35, "car phone mount magnetic holder"),
    ("手机散热器 磁吸半导体降温", "半导体制冷|手机吃鸡电竞降温|RGB灯效", 69, "phone cooler fan gaming semiconductor"),
    ("手机直播补光灯 环形 26cm", "三色温调节|10档亮度|桌面夹式支架", 45, "ring light led phone selfie tripod"),
    # Computer
    ("罗技 MX Master 3S 无线鼠标", "8K DPI|电磁滚轮|跨设备Flow|办公旗舰", 599, "logitech mx master mouse wireless"),
    ("罗技 G502 游戏鼠标", "25K DPI|11个可编程按键|RGB灯效", 299, "logitech g502 gaming mouse"),
    ("雷蛇 DeathAdder V3 游戏鼠标", "64g超轻|30K DPI|Focus Pro传感器|FPS首选", 599, "razer deathadder gaming mouse"),
    ("樱桃 MX3.0S 机械键盘 红轴", "德国樱桃轴|109键|铝合金外壳|办公游戏", 399, "cherry mx mechanical keyboard"),
    ("Keychron K8 Pro 无线机械键盘", "热插拔轴|QMK/VIA改键|Mac/Win双系统", 399, "keychron mechanical keyboard wireless"),
    ("罗技 K380 蓝牙无线键盘 粉色", "小巧便携|3设备切换|iPad/手机/电脑通用", 159, "logitech k380 bluetooth keyboard"),
    ("戴尔 U2723QE 27寸4K显示器", "IPS Black技术|USB-C 90W充电|设计师专业", 3499, "dell 4k monitor usb c professional"),
    ("LG 32寸4K Ergo支架 显示器", "DCI-P3 95%|Type-C 60W|Ergo人体工学", 3999, "lg 4k monitor ergo stand"),
    ("笔记本支架 铝合金 可折叠 6档", "铝合金散热|6档角度调节|颈椎友好", 59, "laptop stand aluminum adjustable"),
    ("显示器支架 双屏气压弹簧臂", "双屏拼接|气压悬停|桌夹式/穿孔式", 189, "dual monitor arm desk mount gas spring"),
    ("USB3.0分线器 7口 带电源", "7口扩展|独立开关|12V外接供电", 59, "usb hub powered 7 port switch"),
    ("西部数据 移动硬盘 2TB USB3.0", "2TB容量|轻薄便携|自动备份软件", 459, "external hard drive portable 2tb"),
    ("三星 T7 Shield 移动固态硬盘 2TB", "IP65防水防尘|1050MB/s|口袋大小", 999, "samsung t7 portable ssd 2tb"),
    ("闪迪 U盘 128GB USB3.2", "读速400MB/s|全金属机身|加密保护", 69, "sandisk usb flash drive metal 128gb"),
    # Audio
    ("索尼 WH-1000XM5 头戴式降噪耳机", "行业最强降噪|30h续航|LDAC高清传输", 2299, "sony wh1000xm5 headphones noise cancelling"),
    ("Bose QC45 头戴式降噪耳机", "Bose标志性降噪|24h续航|极致舒适", 1899, "bose quietcomfort headphones"),
    ("漫步者 真无线蓝牙耳机 Lolli3", "13mm动圈|蓝牙5.3|超低延迟游戏模式", 199, "edifier wireless earbuds bluetooth"),
    ("JBL GO3 便携蓝牙音箱", "IP67防水防尘|5h续航|户外洗澡可用", 269, "jbl portable bluetooth speaker waterproof"),
    ("马歇尔 Stanmore III 家用蓝牙音箱", "经典摇滚造型|大功率|蓝牙5.2 HDMI", 2499, "marshall stanmore speaker home"),
    ("舒尔 MV7 动圈麦克风 USB/XLR", "播客专业录音|USB即插即用|语音隔离技术", 1299, "shure mv7 podcast microphone usb"),
    ("铁三角 ATH-M50x 录音室监听耳机", "专业监听|可折叠收纳|三根可换线", 999, "audiotechnica ath m50x headphones studio"),
    ("声卡 直播声卡套装 V8 电容麦", "手机/电脑通用|48V幻象供电|K歌直播", 259, "audio interface podcast condenser microphone"),
    ("唱吧 G2 小巨蛋 麦克风 蓝牙K歌", "自带音响|4种音效|家庭KTV神器", 199, "karaoke microphone bluetooth speaker portable"),
    # Smart Home
    ("小米 智能摄像头 云台版 2K", "360全景|微光全彩|AI人形追踪", 169, "xiaomi security camera 2k pan tilt"),
    ("小米 智能门铃 3代 2K", "2K分辨率|180超广角|变声对讲|100天续航", 199, "xiaomi video doorbell smart home"),
    ("小爱音箱 Pro 智能音箱", "DTS调音|红外遥控家电|蓝牙Mesh网关", 269, "xiaomi smart speaker home assistant"),
    ("Google Nest Hub 2代 智能屏", "7寸触屏|语音控制智能家居|睡眠监测", 599, "google nest hub smart display"),
    ("涂鸦 智能插座 WiFi版 4个装", "语音/远程控制|定时开关|电量统计", 69, "smart wifi plug socket pack 4"),
    ("飞利浦 Hue 智能灯泡 彩光 2只装", "1600万色|蓝牙Zigbee双模|声控调光", 399, "philips hue smart bulb color ambience"),
    ("米家 智能窗帘电机 WiFi版", "远程/语音/定时控制|静音运行", 399, "smart curtain motor wifi automated home"),
    ("石头 扫地机器人 P10 Pro", "6000Pa吸力|热水洗拖布|AI避障建图", 2999, "roborock robot vacuum mop smart"),
    ("追觅 无线吸尘器 T30", "27000Pa吸力|90min续航|激光探尘", 1999, "cordless vacuum cleaner stick powerful"),
    ("戴森 空气净化器 HP09", "净化+暖风+凉风三合一|HEPA滤网|除甲醛", 4999, "dyson air purifier fan heater combo"),
    # Photography
    ("大疆 Osmo Mobile 6 手机云台", "三轴增稳|磁吸快装|内置自拍杆", 749, "dji osmo mobile gimbal stabilizer"),
    ("大疆 Pocket 3 口袋相机", "1英寸CMOS|4K120fps|三轴云台|Vlog神器", 3399, "dji pocket camera 4k handheld"),
    ("GoPro HERO12 Black 运动相机", "5.3K60fps|HyperSmooth6.0|防水10米", 2999, "gopro hero action camera waterproof"),
    ("索尼 ZV-1 II Vlog相机", "1寸CMOS|18-50mm变焦|内置ND滤镜", 4999, "sony zv1 vlog camera compact"),
    ("佳能 EOS R50 微单相机 套机", "2420万APS-C|4K30p|人眼追踪对焦", 4499, "canon eos r50 mirrorless camera kit"),
    ("神牛 LED补光灯 SL60W", "5600K日光色温|CRI96+高显指|Bowens卡口", 399, "studio led video light photography godox"),
    ("巅峰设计 相机背带 Slide Lite", "快速调节长度|防滑肩垫|承重90kg", 199, "camera strap peak design quick adjust"),
    ("相机三脚架 碳纤维 反折 1.2kg", "碳纤维材质|反折收纳|360全景云台", 499, "carbon fiber tripod camera travel lightweight"),
    ("闪迪 SD卡 Extreme Pro 128GB", "UHS-I U3 V30|读速200MB/s|4K视频专用", 129, "sandisk sd card extreme pro 128gb"),
    ("相机干燥箱 电子防潮柜 30L", "电子除湿|湿度可调|保存镜头防霉", 299, "camera dry cabinet dehumidifier storage"),
    # Cables
    ("HDMI 2.1线 8K 超高速 3米", "48Gbps带宽|8K60Hz/4K120Hz|编织线", 49, "hdmi 2.1 cable ultra high speed 8k"),
    ("DP转HDMI线 4K60Hz 2米", "DisplayPort转HDMI|双向互转|镀金接口", 39, "displayport to hdmi cable adapter 4k"),
    ("Type-C扩展坞 12合1", "HDMI4K+USB3.0+SD/TF+千兆网口+PD100W", 149, "usb c hub multiport adapter 12 in 1"),
    ("雷电4数据线 40Gbps 1米", "Intel认证|8K视频|100W供电|苹果Mac必备", 159, "thunderbolt 4 cable 40gbps certified"),
    ("3.5mm音频线 公对公 5米", "镀金接头|编织线|音箱/车机连接", 29, "aux audio cable 3.5mm stereo gold plated"),
    ("网线 七类 万兆 屏蔽 3米", "10Gbps速率|SSTP双屏蔽|游戏低延迟", 25, "cat7 ethernet cable shielded rj45"),
    ("电源延长线 3孔 3米", "新国标插座延长线|3C认证|阻燃材料", 35, "power extension cord 3 meter plug"),
    ("魔术贴理线带 20条装 多色", "可重复使用|捆扎电脑线束|桌面理线神器", 15, "cable management velcro ties reusable"),
    ("桌面理线盒 大号 白色", "隐藏排插和线束|桌下/桌上通用|简洁桌面", 59, "cable management box desk white organizer"),
    ("万能转换插头 全球通用 带USB", "覆盖200+国家|双USB接口|出国必备", 69, "universal travel adapter plug usb international"),
]

APPAREL = [
    # Men tops
    ("优衣库 男装 圆领T恤 短袖 HEATTECH", "HEATTECH发热科技|吸湿发热|秋冬打底", 79, "uniqlo heattech t shirt men basic"),
    ("SELECTED 男装 商务衬衫 白色 修身", "100%埃及长绒棉|免烫工艺|修身版型", 399, "white dress shirt men formal business"),
    ("太平鸟 男装 休闲衬衫 格子法兰绒", "纯棉法兰绒|格子设计|秋冬叠穿", 199, "flannel shirt checked plaid men casual"),
    ("海澜之家 男装 POLO衫 纯色短袖", "新疆长绒棉|珠地面料|通勤百搭", 129, "polo shirt men cotton solid color"),
    ("阿迪达斯 男装 运动T恤 速干", "AEROREADY速干科技|透气网眼|跑步健身", 149, "adidas sports t shirt men running dry fit"),
    ("马克华菲 男装 卫衣 加绒 连帽", "加厚抓绒内里|纯棉面料|潮牌设计", 219, "hoodie men fleece cotton pullover casual"),
    ("杰克琼斯 男装 针织衫 圆领 纯羊毛", "100%美丽诺羊毛|细针12G|商务休闲", 399, "merino wool sweater men knit crew neck"),
    ("Lilbetter 男装 潮流印花短袖T恤", "个性潮牌印花|250g重磅棉|宽松版型", 99, "graphic t shirt men streetwear cotton"),
    # Men bottoms
    ("优衣库 男装 弹力修身牛仔裤", "弹力面料|修身直筒|日本KAIHARA牛仔布", 249, "slim fit jeans men stretch denim"),
    ("太平鸟 男装 休闲裤 直筒 弹力", "四面弹力面料|立体剪裁|抗皱免烫", 199, "chino pants men straight fit stretch casual"),
    ("阿迪达斯 男装 运动裤 束脚", "AEROREADY快干|束脚设计|运动休闲", 229, "adidas track pants joggers men tapered"),
    ("李维斯 男装 501 经典直筒牛仔裤", "Levis经典501版型|美国进口|养牛首选", 599, "levis 501 original jeans men straight"),
    ("始祖鸟 男装 户外速干长裤", "Gamma LT面料|防泼水|攀岩徒步", 1499, "arcteryx hiking pants men outdoor goretex"),
    ("匡威 男装 工装裤 多口袋 束口", "纯棉工装风|多口袋设计|街头潮流", 269, "cargo pants men cotton streetwear casual"),
    ("GXG 男装 西裤 修身 九分", "弹力面料|免烫抗皱|商务通勤", 299, "dress pants men slim fit business formal"),
    # Women tops
    ("优衣库 女装 圆领T恤 短袖 SUPIMA棉", "100%SUPIMA棉|丝滑触感|基础百搭款", 59, "supima cotton t shirt women basic tee"),
    ("乐町 女装 法式复古碎花衬衫", "雪纺面料|蝴蝶结领结设计|约会通勤", 189, "floral blouse women french style ruffle"),
    ("太平鸟 女装 荷叶边雪纺衫", "荷叶边领口|垂感雪纺|温柔甜美", 169, "ruffle blouse women chiffon elegant"),
    ("ZARA 女装 针织开衫 短款 V领", "细针织法|短款设计|高腰搭配", 249, "cardigan sweater women knit cropped v neck"),
    ("哥弟 女装 真丝衬衫 气质款", "100%桑蚕丝|光泽质感|高级通勤", 499, "silk blouse women elegant office professional"),
    ("ONLY 女装 卫衣 宽松 加绒", "加厚抓绒|宽松BF风|秋冬必备", 229, "sweatshirt women oversized fleece pullover"),
    ("伊芙丽 女装 针织连衣裙 修身", "弹力罗纹针织|修身版型|凸显身材", 329, "knit dress women bodycon ribbed elegant"),
    ("茵曼 女装 棉麻衬衫 宽松文艺", "天然棉麻面料|防晒透气|日系文艺范", 159, "linen shirt women loose casual natural fiber"),
    # Women bottoms
    ("伊芙丽 女装 阔腿裤 高腰 垂感", "高腰设计|垂坠感面料|显瘦神器", 269, "wide leg pants women high waist flowy"),
    ("ONLY 女装 牛仔裤 小脚裤 弹力", "弹力面料|提臀显瘦|百搭经典款", 259, "skinny jeans women stretch high waist denim"),
    ("乐町 女装 A字半身裙 高腰", "A字版型|显高显瘦|学院风减龄", 169, "a line skirt women high waist mini casual"),
    ("哥弟 女装 烟管裤 九分", "烟管裤型|显瘦不紧绷|职场女神首选", 349, "cigarette pants women slim ankle office"),
    ("蕉下 女装 防晒长裤 UPF100+", "UPF100+防晒|冰感凉感|轻盈透气", 199, "sun protection pants women upf cooling fabric"),
    ("MAIA ACTIVE 女装 瑜伽裤 高腰", "高弹力Ex-stretch面料|无缝工艺|提臀健身", 399, "yoga leggings women high waist active seamless"),
    # Unisex/accessories
    ("蕉下 防晒衣 男女通用 UPF100+", "UPF100+防晒|冰感科技|轻薄透气可折叠", 179, "sun protection jacket upf men women lightweight"),
    ("优衣库 防晒外套 可收纳 男女通款", "UV Cut防晒科技|轻薄可折叠|随身携带", 149, "uv protection jacket packable travel unisex"),
    ("匡威 帆布鞋 高帮 Chuck Taylor", "经典Chuck Taylor|硫化底|永不过时", 449, "converse chuck taylor all star high top sneakers"),
    ("Vans Old Skool 经典款 滑板鞋", "经典Sidestripe|耐磨华夫底|街头滑板", 499, "vans old skool sneakers classic skate shoes"),
    ("NB 574 复古跑鞋 男女同款", "New Balance 574系列|经典元祖灰|舒适百搭", 599, "new balance 574 sneakers grey classic"),
    ("耐克 Air Force 1 经典白", "全白AF1|经典鞋型|穿搭神器", 699, "nike air force 1 white sneakers low top"),
    ("猫人 中筒袜 精梳棉 10双装 男", "精梳棉|弹力袜口|商务休闲通用", 39, "cotton socks pack men crew casual business"),
    ("浪莎 丝袜 超薄 5双装 肤色 女", "超薄5D|防勾丝|隐形肤色百搭", 29, "pantyhose nude women sheer skin tone"),
    ("恒源祥 保暖内衣 加绒加厚 男", "阳离子发热面料|加厚加绒|寒冬必备", 89, "thermal underwear men fleece winter warm"),
    ("俞兆林 保暖内衣 加厚 女", "德绒发热科技|不起球不缩水|自发热", 79, "thermal underwear women fleece winter warm"),
    ("蕉内 内裤 莫代尔 3条装 男", "奥地利兰精莫代尔|无痕腰带|抑菌面料", 59, "boxer briefs men modal cotton pack"),
    ("曼妮芬 文胸 无钢圈 舒适 女", "无钢圈设计|立体承托|舒适无压", 129, "wireless bra women comfort seamless tshirt"),
    # Outerwear
    ("波司登 羽绒服 中长款 90%鹅绒", "90%白鹅绒|600+蓬松度|防风防泼水", 899, "down jacket winter goose down men women"),
    ("优衣库 轻羽绒 便携式 男女通款", "ULTRALIGHT DOWN|收纳口袋|750+蓬松度", 399, "ultralight down jacket packable unisex"),
    ("北面 冲锋衣 三合一 1996 Nuptse", "Gore-Tex防风防水|可拆卸内胆|经典复刻", 1999, "north face nuptse jacket down puffer"),
    ("始祖鸟 Beta AR 冲锋衣 男", "Gore-Tex Pro面料|全天候防水|攀岩登山", 5999, "arcteryx beta ar jacket goretex hardshell"),
    ("太平鸟 女装 呢大衣 双面呢 中长款", "100%羊毛双面呢|手工缝制|高级质感", 799, "wool coat women double faced long elegant"),
    ("GXG 男装 呢大衣 单排扣 商务", "80%羊毛混纺|单排扣设计|通勤必备", 699, "wool coat men business casual winter formal"),
    ("蕉下 冲锋衣 男女同款 三防", "防水防风防油污|透气透湿|户外徒步", 399, "waterproof jacket outdoor hiking 3 layer shell"),
    ("探索者 战术冲锋衣 软壳 加绒", "防风防泼水|加厚加绒|多口袋工装风", 299, "tactical softshell jacket men fleece lined outdoor"),
]

GROCERIES = [
    # Snacks
    ("乐事 薯片 原味 大包 135g*3", "经典原味|薄脆口感|追剧必备零食", 29, "lays potato chips classic bag pack"),
    ("品客 薯片 洋葱酸奶油味 158g", "进口品客|罐装不易碎|酸奶油风味", 25, "pringles chips can sour cream onion"),
    ("奥利奥 夹心饼干 原味 388g", "经典黑白配|扭一扭舔一舔|家庭分享装", 19, "oreo cookies chocolate sandwich pack"),
    ("格力高 百奇 巧克力味 12袋装", "日本进口|细棒饼干裹巧克力|办公室零食", 35, "pocky chocolate sticks japanese snack box"),
    ("三只松鼠 每日坚果 混合装 750g", "核桃腰果巴旦木蔓越莓|科学配比|30天装", 69, "mixed nuts dried fruit daily pack trail mix"),
    ("良品铺子 猪肉脯 原味 200g", "精选猪后腿肉|古法炭烤|独立小包装", 25, "pork jerky dried meat snack asian"),
    ("旺旺 仙贝 原味 400g 大礼包", "米香酥脆|独立包装|国民童年零食", 29, "rice cracker senbei japanese snack crispy"),
    ("旺旺 雪饼 原味 400g 大礼包", "白雪般米饼|酥脆清甜|老少皆宜", 29, "rice cake snack cracker asian crispy"),
    ("好丽友 派 巧克力味 12枚装", "巧克力涂层+棉花糖+蛋糕|经典软心派", 19, "chocolate pie snack cake marshmallow"),
    ("卫龙 辣条 大面筋 500g", "经典辣条|香辣Q弹|国民零食之光", 15, "latiao spicy snack strip chinese"),
    # Pasta/Rice/Grains
    ("意大利面 Barilla 5号 500g*3", "意大利原装进口|杜兰硬质小麦|耐煮弹牙", 35, "barilla pasta spaghetti italian dry"),
    ("空刻 意面速食套装 番茄肉酱 270g*5", "15分钟出餐|西餐厅级意面|含酱料包", 59, "pasta meal kit tomato sauce quick dinner"),
    ("十月稻田 东北大米 盘锦蟹田 5kg", "盘锦蟹田共生|当季新米|香甜软糯", 39, "rice grain premium short grain bag asian"),
    ("柴火大院 五常大米 稻花香2号 5kg", "五常核心产区|稻花香2号|国标一级", 59, "premium rice wuchang grain bag fragrant"),
    ("十月稻田 三色糙米 1kg*3袋", "黑米+红米+糙米|营养粗粮|健身控糖", 29, "mixed brown rice grain healthy whole grain"),
    ("桂格 即食燕麦片 1kg*2袋", "全谷物燕麦|免煮即食|早餐冲饮营养", 35, "quaker oats instant oatmeal breakfast cereal"),
    ("金龙鱼 多用途面粉 中筋 5kg", "精选小麦|细腻洁白|包子饺子面条通用", 25, "all purpose flour wheat baking bag"),
    # Sauces
    ("海天 酱油 金标生抽 1.9L", "非转基因大豆|天然晒场酿造|家庭大瓶装", 25, "soy sauce light chinese bottle large"),
    ("李锦记 旧庄蚝油 510g", "上等鲜蚝熬制|零添加防腐剂|正宗粤式调味", 29, "oyster sauce premium chinese cooking"),
    ("老干妈 风味豆豉油制辣椒 280g", "豆豉辣椒|国民女神|拌饭拌面神器", 15, "laoganma chili sauce black bean chinese"),
    ("丘比 沙拉酱 蛋黄酱 400g", "日本配方|香甜口味|沙拉/三明治必备", 19, "kewpie mayonnaise japanese squeeze bottle"),
    ("恒顺 镇江香醋 陈醋 500ml", "中国名醋|糯米酿造|1840年老字号", 15, "chinese black vinegar zhenjiang aged traditional"),
    ("太太乐 鸡精 三鲜 454g", "含真实鸡汤|复合鲜味|炒菜调味提鲜", 19, "chicken bouillon powder seasoning cooking"),
    ("海底捞 火锅底料 牛油麻辣 200g", "正宗川味火锅底料|麻辣鲜香|在家涮锅", 19, "hot pot soup base spicy sichuan mala"),
    ("饭爷 拌面酱 香辣牛肉味 210g", "超大牛肉粒|川渝风味|拌饭拌面一绝", 25, "noodle sauce spicy beef jar chinese"),
    # Beverage bases
    ("川宁 伯爵红茶 茶包 2g*100包", "英国皇室御用|佛手柑风味|可做奶茶", 59, "twinings earl grey tea bags bergamot"),
    ("立顿 黄牌精选红茶 茶包 2g*100", "全球销量第一红茶品牌|独立包装便携", 39, "lipton yellow label black tea bags"),
    ("艺福堂 西湖龙井 绿茶 200g", "西湖产区|明前采摘|中国十大名茶", 89, "longjing dragon well green tea premium chinese"),
    ("小罐茶 铁观音 安溪清香 40g*5", "大师监制|安溪原产|独立氮气保鲜", 199, "tieguanyin oolong tea premium chinese"),
    ("illy 咖啡豆 中度烘焙 250g", "意大利进口|9种阿拉比卡拼配|意式浓缩", 79, "illy coffee beans espresso medium roast arabica"),
    ("星巴克 咖啡豆 深烘 佛罗娜 1.13kg", "门店同款|深度烘焙|黑巧克力焦糖风味", 169, "starbucks coffee beans verona dark roast"),
    ("雀巢 胶囊咖啡 美式 10颗*3盒", "Nespresso兼容|美式大杯|醇苦回甘", 99, "coffee capsules nespresso compatible americano"),
    ("AGF 咖啡液 焦糖风味 18颗", "日本进口浓缩咖啡液|冷水/牛奶即溶", 49, "liquid coffee concentrate japanese caramel"),
    # Baking
    ("雀巢 炼乳 原味 380g", "经典炼乳|蘸面包/做蛋糕|越南咖啡伴侣", 12, "condensed milk sweetened can nestle"),
    ("安佳 黄油 无盐 454g 新西兰进口", "新西兰乳制品|烘焙/煎牛排|纯动物黄油", 45, "unsalted butter block new zealand baking"),
    ("总统 淡奶油 法国进口 1L", "法国诺曼底奶源|烘焙打发|35%乳脂含量", 49, "heavy cream whipping french cooking baking"),
    ("安琪 酵母粉 高活性 5g*30袋", "耐高糖高活性|即发酵母|面包馒头通用", 15, "instant yeast dry baking bread active"),
    ("展艺 烘焙工具套装 新手入门 5件", "打蛋器+刮刀+量杯+筛网+油纸|基础五件套", 35, "baking tools kit beginner set silicone spatula"),
    ("法芙娜 可可粉 无糖 250g", "法国顶级可可品牌|纯可可粉|烘焙/冲饮", 89, "valrhona cocoa powder unsweetened dark"),
    # International
    ("清净园 韩式辣酱 500g", "韩国进口|石锅拌饭/炒年糕|甜辣风味", 25, "gochujang korean chili paste red pepper"),
    ("妙多 泰国红咖喱酱 400g", "正宗泰式红咖喱|椰奶咖喱鸡/牛必备", 22, "thai red curry paste cooking spicy authentic"),
    ("好侍 咖喱块 中辣 100g*5盒", "日式咖喱|即食方便|全家最爱的咖喱饭", 45, "japanese curry roux block golden medium hot"),
    ("寿司海苔 50张 全型 烤紫菜", "日式寿司专用|免洗即用|120g", 25, "sushi nori seaweed sheets dried roasted"),
    ("三岛 味噌酱 白味噌 750g", "日本进口|大豆+米麴发酵|味噌汤正宗配方", 35, "white miso paste japanese soybean fermented"),
    ("越南米粉 即食河粉 鸡肉味 60g*12", "越南进口|开水冲泡3分钟|方便速食河粉", 39, "vietnamese pho instant rice noodle chicken"),
    ("德州扒鸡 五香脱骨 整只 500g", "中华老字号|百年传承|加热即食", 49, "braised chicken ready to eat chinese traditional"),
    ("金华火腿 切片 即食 200g", "国家级非遗工艺|36个月发酵|火腿中的爱马仕", 129, "cured ham sliced prosciutto chinese jinhua"),
    ("日本纳豆 极小粒 3盒装", "极小粒纳豆|高蛋白|健康发酵食品", 29, "natto fermented soybeans japanese healthy"),
    ("韩国泡菜 辣白菜 1kg", "正宗韩式发酵泡菜|下饭小菜|做泡菜汤", 29, "kimchi korean fermented cabbage spicy"),
]

HOME = [
    # Kitchen
    ("双立人 菜刀 切菜刀 中式 18cm", "德国进口不锈钢|一体锻造|锋利耐用", 299, "zwilling chef knife kitchen santoku"),
    ("康宁 玻璃保鲜盒 5件套", "耐热玻璃|冰箱/微波/烤箱/洗碗机通用", 129, "glass food storage container set snapware"),
    ("双枪 筷子 竹筷 10双装", "天然楠竹|无漆无蜡|防霉处理", 19, "bamboo chopsticks set natural reusable"),
    ("苏泊尔 不粘锅 炒锅 32cm 带盖", "麦饭石涂层|电磁炉燃气通用|少油烟", 199, "nonstick wok frying pan with lid ceramic"),
    ("卡罗特 麦饭石 汤锅 24cm", "加厚锅体|不粘内壁|炖汤煮面多功能", 159, "soup pot nonstick ceramic kitchen stockpot"),
    ("双立人 刀具套装 6件套 带刀座", "德国不锈钢|主厨刀+面包刀+多用刀+厨房剪+磨刀棒", 599, "zwilling knife block set kitchen 6 piece"),
    ("象印 不锈钢保温壶 1.9L", "日本进口|真空双层保温|按压式出水", 269, "zojirushi thermal pot vacuum insulated dispenser"),
    ("虎牌 保温饭盒 2层 0.9L", "日本进口|超强保温6小时|自带筷子", 399, "tiger thermal lunch box bento japanese 2 tier"),
    ("膳魔师 保温杯 500ml 不锈钢", "德国保温技术|12小时保温|一键弹盖设计", 179, "thermos vacuum flask bottle stainless steel"),
    ("特百惠 保鲜盒 10件套", "食品级PP材质|密封防漏|可叠放收纳", 89, "tupperware food container set plastic storage"),
    # Bathroom
    ("资生堂 沐浴露 可悠然 550ml", "日本进口|温和清洁|泡沫丰富细腻", 69, "shiseido body wash shower gel moisturizing"),
    ("吕 洗发水 深层清洁 去屑 500ml", "韩国进口|红参配方|深层清洁去屑控油", 79, "ryo shampoo anti dandruff korean herbal"),
    ("力士 沐浴露 恣情香氛 900ml", "含精油香氛|持久留香|大容量家庭装", 49, "lux body wash fragrant shower gel floral"),
    ("摩登主妇 牙刷架 免打孔 4口", "壁挂式免打孔|紫外线杀菌|自动挤牙膏", 59, "toothbrush holder wall mounted bathroom uv"),
    ("力邦 马桶刷 套装 壁挂", "壁挂沥水|带底座收纳|不脏手设计", 19, "toilet brush set wall mounted bathroom cleaner"),
    ("大卫 刮水器 浴室刮水扫把 硅胶", "硅胶刮条|不伤瓷砖地面|快速刮水不留痕", 15, "silicone squeegee bathroom floor shower"),
    ("小林制药 马桶清洁剂 120g*6", "日本进口|除菌除臭|不伤釉面", 39, "toilet bowl cleaner tablet japanese deodorizer"),
    ("洁丽雅 浴巾 纯棉 抗菌 70*140cm", "新疆长绒棉|抗菌防螨|超强吸水速干", 49, "cotton bath towel white large luxury soft"),
    # Bedroom
    ("水星家纺 四件套 纯棉 40支 1.5m床", "100%新疆棉|活性印染|不起球不褪色", 199, "cotton bedsheet set 4 piece double bed"),
    ("罗莱家纺 蚕丝被 二合一 1.5m床", "100%桑蚕丝|子母被四季通用|手工拉制", 699, "silk duvet comforter mulberry luxury bedding"),
    ("网易严选 乳胶枕 天然泰国乳胶", "93%天然乳胶|人体工学曲线|透气防螨", 169, "latex pillow thai natural ergonomic orthopedic"),
    ("Muji 无印良品 凉感被 夏被 150x210", "冷感面料|无需被套|可水洗清洁", 199, "cooling blanket summer quilt thin lightweight"),
    ("艾美特 电热毯 双人 双温双控", "双人双控独立调温|6档温度|定时除螨", 169, "electric blanket heated double bed dual control"),
    ("天堂 遮光窗帘 全遮光 2片 2.7m", "100%物理遮光|隔热隔音|北欧简约", 129, "blackout curtains thermal insulated panel room darkening"),
    ("宜家 落地灯 简约 北欧风", "布艺灯罩|暖光温馨|客厅卧室百搭", 149, "floor lamp nordic fabric shade standing"),
    ("小米 人体感应夜灯 2只装", "人体红外感应|柔光不刺眼|超长续航", 49, "motion sensor night light led auto"),
    # Organization
    ("倍思奇 收纳箱 前开式 66L 3个装", "前开翻盖设计|可折叠收纳|加厚PP材质", 89, "storage box folding stackable plastic large"),
    ("优思居 衣物收纳袋 真空压缩 6件套", "抽真空压缩|节省80%空间|配抽气泵", 39, "vacuum storage bags compression travel space saver"),
    ("懒角落 鞋盒 翻盖式 12个装", "透明翻盖设计|可叠放收纳|防潮防尘", 69, "shoe storage box clear stackable container"),
    ("懒角落 厨房置物架 多层 落地", "加厚碳钢|4层可调高度|锅具微波炉收纳", 89, "kitchen shelf rack storage organizer metal"),
    ("优思居 化妆品收纳盒 带盖 防尘", "透明亚克力材质|三层带抽屉|桌面整洁", 39, "acrylic makeup organizer drawer cosmetic storage"),
    ("太力 真空压缩袋 免抽气 6件套", "手压排气免抽气泵|防霉防潮|旅行搬家必备", 29, "compression packing cubes travel space saver"),
    # Decor
    ("宜家 相框 10个装 白色 21x30cm", "轻巧挂墙/摆台|黑白双色可选|装饰画框", 39, "picture frame white set wall decor poster"),
    ("月球灯 3D打印 16cm 暖白 可充电", "3D打印月球纹理|触控三档调光|浪漫礼物", 69, "moon lamp 3d printed led night light"),
    ("MUJI 香薰机 超声波 300ml", "超声波雾化技术|定时关闭|无印良品同款", 169, "ultrasonic aroma diffuser essential oil humidifier"),
    ("龟背竹 盆栽 含盆 50cm", "北欧风网红绿植|空气净化|好养易活", 45, "monstera plant potted indoor tropical swiss cheese"),
    ("仿真花 客厅装饰 12支", "仿真玫瑰花|不需打理|永久鲜艳", 29, "artificial flowers fake rose bouquet realistic"),
    ("挂毯 波西米亚风 80x100cm", "北欧波西米亚风格|棉线编织|拍照背景墙", 49, "macrame wall hanging tapestry boho decor"),
    ("精油套装 6瓶 10ml", "薰衣草+甜橙+薄荷+柠檬+茶树+尤加利|香薰按摩", 39, "essential oils set aromatherapy 6 pack natural"),
    ("灭蚊灯 紫外线 捕蚊 静音", "物理灭蚊|无烟无毒|孕妇婴儿适用", 49, "mosquito killer lamp uv insect trap electric"),
    # Cleaning
    ("追觅 扫地机器人 S10 Pro", "自清洁拖布|LDS激光导航|5300Pa大吸力", 2499, "robot vacuum mop self cleaning lidar smart"),
    ("必胜 洗地机 吸拖一体", "吸拖一体|一键自清洁|干湿垃圾一次搞掂", 999, "wet dry vacuum floor cleaner cordless home"),
    ("妙洁 拖把 平板免手洗 干湿两用", "免手洗设计|360旋转灵活|干湿两用", 49, "flat mop self wringing floor cleaning microfiber"),
    ("花王 衣物除菌液 替换装 810ml", "日本进口|99.9%除菌|婴幼儿可用安全", 35, "laundry sanitizer disinfectant liquid antibacterial"),
    ("蓝月亮 洗衣液 薰衣草香 3kg", "深层洁净|温和不伤手|持久留香", 49, "laundry detergent liquid lavender scented"),
    ("威猛先生 厨房清洁剂 重油污 500ml", "除重油污|不伤厨具表面|厨房清洁神器", 25, "kitchen degreaser cleaner heavy duty grease"),
    ("滴露 消毒液 750ml", "英国进口|医用级消毒|衣物家居通用", 49, "dettol disinfectant liquid antiseptic antibacterial"),
]

LIFESTYLE = [
    # Fitness
    ("李宁 跑步鞋 超轻 男款", "超轻EVA中底|透气飞织鞋面|日常慢跑训练", 299, "li ning running shoes lightweight men breathable"),
    ("安踏 篮球鞋 KT9 克莱汤普森", "氮科技中底|碳板抗扭|实战篮球签名鞋", 599, "anta basketball shoes klay thompson signature"),
    ("特步 竞速跑鞋 160X 3.0 碳板", "全掌碳板|超临界发泡中底|马拉松竞速", 799, "carbon plate running shoes marathon race"),
    ("匹克 态极 拖鞋 男女同款", "态极自适应科技|踩屎感|浴室可穿防滑", 99, "sports slides sandals cloud cushion unisex"),
    ("瑜伽垫 加厚加宽 TPE 183x80cm", "双层TPE材质|10mm加厚|双面防滑纹理", 79, "yoga mat thick tpe large exercise fitness"),
    ("Keep 健腹轮 自动回弹 智能计数", "APP互联计数|智能回弹辅助|核心训练神器", 89, "ab roller wheel automatic rebound smart count"),
    ("哑铃 可调节 快调 20kg 一对", "一秒快速换重|2-20kg可调|不伤地板包胶", 459, "adjustable dumbbell set quick change home gym"),
    ("弹力带 阻力带 套装 5条", "5种不同拉力|天然乳胶|配收纳袋便携", 39, "resistance bands set exercise workout loop"),
    ("筋膜枪 深层按摩 6档 8按摩头", "专业级无刷电机|6档调速|Type-C充电便携", 159, "massage gun deep tissue muscle percussive therapy"),
    ("TRX 悬挂训练带 门扣版", "美国原版|全身抗阻训练|随时随地健身", 149, "trx suspension trainer straps home gym door anchor"),
    ("健腹轮 升级款 宽轮 自动回弹", "加宽加厚不侧翻|自动回弹|静音滚轮", 59, "ab wheel roller wide stability core exercise"),
    ("半指手套 健身 举重 防滑", "加厚掌垫保护|透气网布|防滑耐磨握力", 29, "gym gloves workout weightlifting grip padded"),
    ("Reebok 踏步机 家用 迷你 静音", "液压阻力系统|液晶显示|瘦腿提臀", 299, "stepper machine mini home cardio exercise"),
    ("Keep 动感单车 C1 磁控 静音", "磁控阻力系统|APP课程同步|居家骑行训练", 1499, "spin bike indoor cycling magnetic resistance home"),
    # Outdoor
    ("牧高笛 露营帐篷 3-4人 双层", "自动速开设计|防风防雨|户外露营必备", 299, "camping tent 4 person pop up outdoor waterproof"),
    ("挪客 睡袋 信封式 羽绒 0度", "羽绒填充保暖|信封式可拼接|轻量便携", 199, "sleeping bag down mummy camping backpacking"),
    ("探路者 冲锋衣 男女 三合一", "可拆卸内胆|防风防水透气|登山徒步外套", 599, "hiking jacket waterproof 3 in 1 outdoor shell"),
    ("骆驼 登山杖 碳纤维 超轻 一对", "3K碳纤维材质|仅180g/根|四节伸缩折叠", 169, "trekking poles carbon fiber hiking pair ultralight"),
    ("探路者 徒步背包 50L 带防雨罩", "50L大容量|透气背负系统|多仓分区收纳", 229, "hiking backpack 50l outdoor travel bag pack"),
    ("挪客 野餐垫 防水防潮 200x200cm", "加厚防潮设计|可折叠收纳|户外野餐必备", 49, "picnic mat blanket waterproof outdoor large family"),
    ("牧高笛 折叠椅 铝合金 轻量", "7075航空铝合金|仅重800g|承重120kg", 129, "camping chair folding lightweight aluminum portable"),
    ("原始人 户外折叠桌 铝合金 中号", "铝合金桌面|折叠收纳便携|配收纳包", 99, "camping table folding portable aluminum outdoor"),
    ("烧烤炉 户外 便携 折叠 不锈钢", "不锈钢烤网|折叠收纳|3-5人烧烤适用", 89, "portable bbq grill charcoal folding outdoor camping"),
    ("太阳能露营灯 10000mAh 3档调光", "太阳能+USB双充|10000mAh充电宝功能|防水", 59, "solar camping lantern rechargeable led power bank"),
    ("户外水壶 钛合金 750ml", "TA1纯钛材质|仅重110g|无异味耐腐蚀", 239, "titanium water bottle ultralight hiking camping"),
    ("急救包 户外家庭应急 210件套", "210件急救用品|防水收纳包|户外探险必备", 59, "first aid kit emergency medical 200 piece"),
    # Travel
    ("小米 90分 旅行箱 20寸 登机箱", "德国拜耳PC材质|TSA密码锁|静音万向轮", 299, "carry on luggage 20 inch spinner hardside cabin"),
    ("外交官 拉杆箱 24寸 万向轮", "铝框加固|TSA海关锁|PC+ABS复合材质", 499, "luggage 24 inch spinner hardside travel suitcase"),
    ("旅行收纳袋套装 防水 6件套", "衣物分装整理|防水面料|出差打包神器", 29, "packing cubes travel organizer set compression"),
    ("充气旅行枕 U型 按压充气", "按压30秒充气|慢回弹记忆棉|收纳小巧便携", 39, "travel neck pillow inflatable airplane memory foam"),
    ("MUJI 无印良品 旅行分装瓶 6件套", "化妆品分装瓶|防漏设计|小于100ml可登机", 29, "travel bottles toiletry containers set portable"),
    ("行李箱保护套 弹性 通用", "弹力面料|防刮花壳|多种图案可选", 25, "luggage cover protector elastic suitcase print"),
    ("护照套 RFID防盗刷 旅行钱包", "RFID防盗刷技术|防水面料|多卡位", 39, "passport holder rfid blocking travel wallet organizer"),
    ("眼罩 真丝 3D遮光 睡眠", "100%桑蚕丝|3D立体不压眼|飞机/居家两用", 29, "silk sleep mask eye mask 3d contoured soft"),
    # Personal care
    ("飞利浦 电动牙刷 HX6853 声波", "31000次/分声波震动|3种清洁模式|2支替换头", 299, "philips sonicare electric toothbrush rechargeable"),
    ("Oral-B 电动牙刷 Pro 1000", "3D前后震动清洁|压力感应防损伤|德国制造", 199, "oral b electric toothbrush pro rechargeable"),
    ("松下 冲牙器 便携式 EW1511", "喷射水流技术|牙缝清洁|充电式防水", 329, "water flosser portable cordless dental irrigator"),
    ("小米 鼻毛修剪器 防水 充电式", "双刃刀头|IPX7全身防水|Type-C充电", 49, "nose hair trimmer electric waterproof rechargeable"),
    ("飞科 剃须刀 三刀头 全身水洗", "三刀头浮动贴面|智能防夹须|1小时快充", 129, "electric shaver rotary men rechargeable wet dry"),
    ("戴森 吹风机 Supersonic", "数码马达|智能温控|快速干发不伤发质", 2999, "dyson supersonic hair dryer professional"),
    ("松下 吹风机 纳米水离子 1800W", "nanoe纳米水离子|润护秀发|恒温护发", 599, "panasonic hair dryer nanoe ionic salon quality"),
    ("直白 卷发棒 负离子 陶瓷 32mm", "千万级负离子|陶瓷釉涂层|恒温不伤发质", 129, "curling iron ceramic ionic hair styler 32mm"),
    # Sports accessories
    ("小米手环 8 Pro 1.74寸AMOLED", "独立GPS定位|150+运动模式|血氧心率监测", 399, "xiaomi smart band fitness tracker amoled"),
    ("佳明 运动手表 Forerunner 255", "双频多星GPS|训练建议计划|铁人三项专业", 2399, "garmin forerunner running watch gps multisport"),
    ("运动水壶 不锈钢 真空保温 1000ml", "316不锈钢内胆|12小时保温|24小时保冷", 89, "stainless steel water bottle insulated sport large"),
    ("止汗带 运动头带 吸汗 男女通用", "超细纤维吸水|防滑硅胶条|跑步篮球通用", 19, "sweatband headband sports running tennis unisex"),
    ("运动护膝 加压 髌骨带 2只", "加压防护设计|弹簧支撑|跑步/篮球/健身", 39, "knee brace compression support sports sleeve pair"),
    ("护腕 运动 加压 透气 2只装", "加压腕带|透气弹力面料|举重/篮球/羽毛球", 19, "wrist brace support wrap sports compression pair"),
    ("泳镜 专业 防雾 近视可配度数", "高清防雾镜片|UV防护|可配左右不同度数", 69, "swimming goggles anti fog prescription optical"),
    ("泳帽 硅胶 防水 长头发适用", "硅胶防水材质|立体设计|护耳不勒头", 25, "silicone swim cap waterproof long hair adult"),
]

MERCHANTS = {
    "Beverages": (6, "美味生活", "全球美食严选 — 进口零食、茶饮、粮油调味，舌尖上的环球旅行", "021-5555-0001"),
    "Electronics": (4, "数码先锋", "智能数码产品专卖 — 手机、电脑、平板、耳机，科技改变生活", "010-1001-0001"),
    "Apparel": (5, "时尚衣橱", "潮流服饰鞋包 — 精选品牌好货，穿出你的风格", "0571-6666-0001"),
    "Groceries": (6, "美味生活", "全球美食严选 — 进口零食、茶饮、粮油调味，舌尖上的环球旅行", "021-5555-0001"),
    "Home": (7, "家居精品", "品质家居生活馆 — 厨具、家纺、收纳、清洁，让生活更美好", "0755-3333-0001"),
    "Lifestyle": (8, "运动达人", "运动户外装备一站购 — 跑步、健身、露营、骑行", "028-7777-0001"),
}

ALL_CATEGORIES = [
    ("Beverages", BEVERAGES),
    ("Electronics", ELECTRONICS),
    ("Apparel", APPAREL),
    ("Groceries", GROCERIES),
    ("Home", HOME),
    ("Lifestyle", LIFESTYLE),
]

NOW = "2026-06-17 00:00:00"

# Generate all products
all_products = []
for cat, templates in ALL_CATEGORIES:
    for name, desc, price, keyword in templates:
        all_products.append((cat, name, desc, price, keyword))

print(f"Total templates: {len(all_products)}")

# Write SQL
with open("c:/Users/14188/Desktop/CA_Team4/SpringBoot_CA/tmp/insert-products.sql", "w", encoding="utf-8") as f:
    f.write("START TRANSACTION;\n")
    for i, (cat, name, desc, price, keyword) in enumerate(all_products):
        mid, mname, mdesc, mcontact = MERCHANTS[cat]
        stock = random.randint(20, 500)
        low_stock = max(1, min(5, int(stock * 0.05)))
        day_offset = random.randint(0, 30)

        safe_name = name.replace("'", "''")
        safe_desc = desc.replace("'", "''")
        safe_mname = mname.replace("'", "''")
        safe_mdesc = mdesc.replace("'", "''")

        sql = f"""INSERT INTO products (name, category, description, price, stock_quantity, low_stock_threshold, sales_count, active, image_url, merchant_id, merchant_name, merchant_description, merchant_contact, created_at) VALUES ('{safe_name}', '{cat}', '{safe_desc}', {price}, {stock}, {low_stock}, 0, 1, NULL, {mid}, '{safe_mname}', '{safe_mdesc}', '{mcontact}', DATE_SUB('{NOW}', INTERVAL {day_offset} DAY));\n"""
        f.write(sql)
    f.write("COMMIT;\n")

print(f"SQL written: {len(all_products)} INSERTs")

# Write keyword mapping for image download
with open("c:/Users/14188/Desktop/CA_Team4/SpringBoot_CA/tmp/keywords.json", "w", encoding="utf-8") as f:
    json.dump({str(i+1): kw for i, (_, _, _, _, kw) in enumerate(all_products)}, f, ensure_ascii=False)

print("Keywords JSON written")
print(f"Categories: { {cat: sum(1 for c,_,_,_,_ in all_products if c==cat) for cat in set(c for c,_,_,_,_ in all_products)} }")
