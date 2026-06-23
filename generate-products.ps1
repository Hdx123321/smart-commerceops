$ErrorActionPreference = "Stop"

# ============ CATEGORY DATA GENERATORS ============

function Gen-Beverages {
    $items = @()
    # Soft drinks
    $softs = @(
        @{n="可口可乐 经典罐装 330ml*24"; d="经典配方｜含汽饮料｜办公室家庭囤货装"; p=59; kw="coca cola classic can pack"},
        @{n="百事可乐 罐装 330ml*24"; d="清爽口感｜含汽饮料｜聚会必备"; p=55; kw="pepsi cola can pack"},
        @{n="雪碧 柠檬味 罐装 330ml*24"; d="柠檬风味｜清爽解腻｜冰镇更好喝"; p=55; kw="sprite lemon soda can"},
        @{n="芬达 橙味 罐装 330ml*24"; d="橙味碳酸饮料｜果味汽水｜夏日必备"; p=55; kw="fanta orange soda can"},
        @{n="美年达 葡萄味 罐装 330ml*24"; d="葡萄味碳酸饮料｜果味浓郁"; p=55; kw="grape soda drink can"},
        @{n="七喜 柠檬汽水 罐装 330ml*24"; d="清爽柠檬味｜无咖啡因｜全家适用"; p=55; kw="7up lemon lime soda"},
        @{n="怡泉 苏打水 罐装 330ml*24"; d="无糖苏打水｜0热量｜调酒伴侣"; p=49; kw="schweppes soda water can"},
        @{n="元气森林 白桃味苏打气泡水 480ml*15"; d="0糖0脂0卡｜白桃风味｜代糖赤藓糖醇"; p=69; kw="sparkling water peach flavor"},
        @{n="元气森林 卡曼橘味苏打气泡水 480ml*15"; d="卡曼橘味｜清爽酸甜｜网红气泡水"; p=69; kw="sparkling water citrus bottle"},
        @{n="农夫山泉 天然水 550ml*24"; d="天然水源｜弱碱性水｜日常饮用"; p=36; kw="bottled mineral water pack"},
        @{n="百岁山 天然矿泉水 570ml*24"; d="深层矿泉水｜偏硅酸型｜贵族品质"; p=48; kw="premium mineral water bottle"},
        @{n="依云 天然矿泉水 500ml*24"; d="法国阿尔卑斯山天然水源｜进口高端水"; p=89; kw="evian mineral water bottle"},
        @{n="巴黎水 含气天然矿泉水 330ml*24"; d="法国进口｜天然含气｜西餐佐餐"; p=138; kw="perrier sparkling water glass"},
        @{n="圣培露 含气矿泉水 250ml*24"; d="意大利进口｜细腻气泡｜米其林餐厅用"; p=128; kw="san pellegrino sparkling water"},
        @{n="魔爪 能量饮料 罐装 355ml*12"; d="含牛磺酸咖啡因｜电竞游戏｜提神醒脑"; p=72; kw="monster energy drink can"},
        @{n="红牛 维生素功能饮料 250ml*24"; d="牛磺酸+咖啡因+维生素B族｜加班提神"; p=129; kw="red bull energy drink can"},
        @{n="东鹏特饮 维生素饮料 500ml*15"; d="国产功能饮料｜牛磺酸配方｜运动后补充"; p=69; kw="energy drink bottle asian"},
        @{n="焕神 电解质饮料 西柚味 500ml*15"; d="电解质+维生素B｜运动后补水｜防脱水"; p=65; kw="electrolyte sports drink bottle"},
        @{n="宝矿力水特 电解质饮料 500ml*24"; d="日本进口｜专业补水｜发烧腹泻后补充"; p=96; kw="pocari sweat drink bottle"},
        @{n="维他柠檬茶 250ml*24"; d="港式柠檬茶｜真茶+真柠檬｜冷藏更佳"; p=55; kw="vita lemon tea drink carton"}
    )
    # Tea
    $teas = @(
        @{n="三得利 无糖乌龙茶 500ml*15"; d="0糖0脂｜武夷岩茶原料｜日式工艺"; p=52; kw="suntory oolong tea bottle"},
        @{n="伊藤园 浓味绿茶 500ml*15"; d="日本第一茶饮品牌｜浓郁抹茶风味"; p=58; kw="itoen green tea bottle"},
        @{n="东方树叶 茉莉花茶 500ml*15"; d="0糖0卡｜真茶叶萃取｜花香清新"; p=48; kw="jasmine green tea bottle"},
        @{n="东方树叶 红茶 500ml*15"; d="0糖0脂｜真茶汤｜醇厚甘甜"; p=48; kw="black tea bottle drink"},
        @{n="康师傅 冰红茶 500ml*15"; d="柠檬红茶味｜冰镇饮用更佳｜国民饮料"; p=45; kw="ice lemon tea bottle"},
        @{n="康师傅 冰糖雪梨 500ml*15"; d="雪梨汁+冰糖｜秋冬润喉｜温热可饮"; p=45; kw="pear juice drink bottle"},
        @{n="王老吉 凉茶 310ml*24"; d="草本凉茶｜不上火｜火锅烧烤绝配"; p=68; kw="herbal tea drink wong lo kat"},
        @{n="加多宝 凉茶 310ml*24"; d="三花三草一叶配方｜国家级非遗"; p=65; kw="jiaduobao herbal tea can"},
        @{n="统一 阿萨姆奶茶 500ml*15"; d="印度阿萨姆红茶+进口奶源｜丝滑口感"; p=52; kw="assam milk tea bottle"},
        @{n="香飘飘 原味奶茶 杯装 80g*30"; d="即冲即饮｜办公室奶茶｜冬日暖心"; p=69; kw="instant milk tea cup"}
    )
    # Coffee
    $coffees = @(
        @{n="雀巢 罐装咖啡 原味 240ml*24"; d="经典罐装｜冷藏更佳｜加班续命"; p=65; kw="nescafe canned coffee"},
        @{n="雀巢 金牌冻干速溶咖啡 200g"; d="冻干技术｜即冲即溶｜哥伦比亚豆"; p=89; kw="nescafe instant coffee jar"},
        @{n="星巴克 星冰乐 瓶装 281ml*12"; d="门店同款｜摩卡风味｜即饮咖啡"; p=156; kw="starbucks frappuccino bottled"},
        @{n="隅田川 冷萃咖啡液 10颗装"; d="日式冷萃｜冷水即溶｜醇苦不酸"; p=49; kw="cold brew coffee liquid japanese"},
        @{n="三顿半 精品速溶咖啡粉 3g*24颗"; d="冷热水即溶｜数字系列｜精品咖啡"; p=129; kw="specialty instant coffee capsules"},
        @{n="永璞 咖啡液 浓缩液 25g*8"; d="中国精品咖啡品牌｜云南豆+国际豆拼配"; p=59; kw="coffee concentrate liquid"},
        @{n="瑞幸 冻干咖啡粉 3g*18颗"; d="门店同款烘焙｜精品速溶｜国货咖啡"; p=69; kw="luckin instant coffee powder"},
        @{n="麦斯威尔 速溶咖啡 100g*2"; d="经典美式速溶｜醇厚口感｜大容量装"; p=49; kw="maxwell house instant coffee"},
        @{n="UCC 117速溶咖啡 90g"; d="日本进口｜深度烘焙｜偏苦风味"; p=39; kw="ucc japanese instant coffee"},
        @{n="AGF Blendy 速溶咖啡 80g"; d="日本进口｜柔和口感｜适合兑牛奶"; p=45; kw="agf blendy instant coffee"}
    )
    # Dairy & plant milk
    $dairy = @(
        @{n="德亚 高钙全脂纯牛奶 200ml*30"; d="德国进口｜3.8g乳蛋白｜高钙配方"; p=79; kw="whole milk carton full cream"},
        @{n="安佳 脱脂纯牛奶 250ml*24"; d="新西兰进口｜0%脂肪｜健身减脂"; p=85; kw="skim milk carton pack"},
        @{n="Oatly 燕麦奶 咖啡大师 1L*6"; d="瑞典进口｜植物奶｜拉花专用"; p=168; kw="oat milk barista edition"},
        @{n="维他 原味豆奶 250ml*24"; d="非转基因大豆｜高蛋白｜港式经典"; p=65; kw="soy milk vita drink pack"},
        @{n="宾格瑞 草莓味香蕉味牛奶 200ml*12"; d="韩国进口｜含真实果肉｜童年回忆"; p=72; kw="korean flavored milk banana strawberry"},
        @{n="卡士 酸奶 原味 100g*18"; d="生牛乳发酵｜活菌酸奶｜儿童早餐"; p=55; kw="yogurt cup pack dairy"},
        @{n="蒙牛 纯甄 原味酸奶 200g*10"; d="丹麦菌种发酵｜口感浓稠｜送礼佳品"; p=59; kw="yogurt drink bottle pack"},
        @{n="乐纯 希腊酸奶 草莓味 135g*6"; d="三倍生牛乳浓缩｜高蛋白｜零脂肪"; p=52; kw="greek yogurt cup fruit"},
        @{n="露露 杏仁露 240ml*20"; d="河北承德特产｜野生山杏仁｜植物蛋白"; p=65; kw="almond milk drink chinese"},
        @{n="椰树 椰汁 245ml*24"; d="海南椰子鲜榨｜从小喝到大｜国宴饮料"; p=69; kw="coconut juice drink can"}
    )
    $items += $softs; $items += $teas; $items += $coffees; $items += $dairy
    return $items
}

function Gen-Electronics {
    $items = @()
    # Phones & accessories
    $phones = @(
        @{n="iPhone 15 Pro 钢化膜 2片装"; d="9H硬度｜全屏覆盖｜防指纹油污"; p=29; kw="iphone tempered glass screen protector"},
        @{n="iPhone 15 Pro Max 防摔手机壳"; d="军工级防摔｜透明不发黄｜MagSafe磁吸"; p=49; kw="iphone protective case clear"},
        @{n="三星 S24 Ultra 曲面钢化膜"; d="曲屏专用｜UV光固化｜全胶贴合"; p=39; kw="samsung screen protector film"},
        @{n="Type-C 快充数据线 100W 2米"; d="100W PD快充｜尼龙编织｜双Type-C"; p=25; kw="usb c fast charging cable"},
        @{n="MFi认证 苹果数据线 Lightning 1.5米"; d="苹果官方认证｜兼容iPhone全系列｜快充"; p=29; kw="apple lightning cable mfi certified"},
        @{n="无线充电器 三合一 手机+手表+耳机"; d="同时充三设备｜MagSafe磁吸｜床头必备"; p=89; kw="3 in 1 wireless charging station"},
        @{n="氮化镓GaN充电器 100W 四口"; d="2C+2A｜笔记本手机平板通用｜折叠插脚"; p=119; kw="gan charger 100w usb c"},
        @{n="车载手机支架 出风口磁吸款"; d="磁吸360度旋转｜不挡出风口｜稳固防抖"; p=35; kw="car phone mount magnetic holder"},
        @{n="手机散热器 磁吸半导体降温"; d="半导体制冷｜手机吃鸡电竞降温｜RGB灯效"; p=69; kw="phone cooler fan gaming semiconductor"},
        @{n="手机直播补光灯 环形 26cm"; d="三色温调节｜10档亮度｜桌面夹式支架"; p=45; kw="ring light led phone selfie"}
    )
    # Computer peripherals
    $computer = @(
        @{n="罗技 MX Master 3S 无线鼠标"; d="8K DPI｜电磁滚轮｜跨设备Flow｜办公旗舰"; p=599; kw="logitech mx master mouse"},
        @{n="罗技 G502 英雄联盟联名版 鼠标"; d="25K DPI｜11个可编程按键｜LOL联名"; p=299; kw="logitech g502 gaming mouse"},
        @{n="雷蛇 DeathAdder V3 游戏鼠标"; d="64g超轻｜30K DPI｜Focus Pro传感器｜FPS首选"; p=599; kw="razer deathadder gaming mouse"},
        @{n="樱桃 MX3.0S 机械键盘 红轴"; d="德国樱桃轴｜109键｜铝合金外壳｜办公游戏"; p=399; kw="cherry mx mechanical keyboard"},
        @{n="Keychron K8 Pro 无线机械键盘"; d="热插拔轴｜QMK/VIA改键｜Mac/Win双系统"; p=399; kw="keychron mechanical keyboard wireless"},
        @{n="罗技 K380 蓝牙无线键盘 粉色"; d="小巧便携｜3设备切换｜iPad/手机/电脑通用"; p=159; kw="logitech k380 bluetooth keyboard"},
        @{n="戴尔 U2723QE 27寸4K显示器"; d="IPS Black技术｜USB-C 90W充电｜设计师专业"; p=3499; kw="dell 4k monitor usb c"},
        @{n="LG 32UN880 32寸4K Ergo支架 显示器"; d="DCI-P3 95%｜Type-C 60W｜Ergo人体工学"; p=3999; kw="lg 4k monitor ergo stand"},
        @{n="笔记本支架 铝合金 可折叠 6档"; d="铝合金散热｜6档角度调节｜颈椎友好"; p=59; kw="laptop stand aluminum adjustable"},
        @{n="显示器支架 双屏气压弹簧臂"; d="双屏拼接｜气压悬停｜桌夹式/穿孔式"; p=189; kw="dual monitor arm desk mount"},
        @{n="USB3.0分线器 7口 带电源"; d="7口扩展｜独立开关｜12V外接供电"; p=59; kw="usb hub powered 7 port"},
        @{n="西部数据 移动硬盘 2TB USB3.0"; d="2TB容量｜轻薄便携｜自动备份软件"; p=459; kw="external hard drive portable 2tb"},
        @{n="三星 T7 Shield 移动固态硬盘 2TB"; d="IP65防水防尘｜1050MB/s｜口袋大小"; p=999; kw="samsung t7 portable ssd 2tb"},
        @{n="闪迪 U盘 128GB USB3.2"; d="读速400MB/s｜全金属机身｜加密保护"; p=69; kw="sandisk usb flash drive metal"}
    )
    # Audio
    $audio = @(
        @{n="AirPods Pro 2代 替换耳塞 3对装"; d="原装硅胶｜S/M/L三对｜舒适贴合"; p=29; kw="airpods pro ear tips silicone"},
        @{n="索尼 WH-1000XM5 头戴式降噪耳机"; d="行业最强降噪｜30h续航｜LDAC高清传输"; p=2299; kw="sony wh1000xm5 headphones"},
        @{n="Bose QC45 头戴式降噪耳机"; d="Bose标志性降噪｜24h续航｜极致舒适"; p=1899; kw="bose quietcomfort headphones"},
        @{n="漫步者 真无线蓝牙耳机 Lolli3"; d="13mm动圈｜蓝牙5.3｜超低延迟游戏模式"; p=199; kw="edifier wireless earbuds"},
        @{n="JBL GO3 便携蓝牙音箱"; d="IP67防水防尘｜5h续航｜户外洗澡可用"; p=269; kw="jbl portable bluetooth speaker"},
        @{n="马歇尔 Stanmore III 家用蓝牙音箱"; d="经典摇滚造型｜大功率｜蓝牙5.2 HDMI"; p=2499; kw="marshall stanmore speaker"},
        @{n="舒尔 MV7 动圈麦克风 USB/XLR"; d="播客专业录音｜USB即插即用｜语音隔离技术"; p=1299; kw="shure mv7 podcast microphone"},
        @{n="铁三角 ATH-M50x 录音室监听耳机"; d="专业监听｜可折叠收纳｜三根可换线"; p=999; kw="audiotechnica ath m50x headphones"},
        @{n="声卡 直播声卡套装 V8 电容麦"; d="手机/电脑通用｜48V幻象供电｜K歌直播"; p=259; kw="live streaming audio interface microphone"},
        @{n="唱吧 G2 小巨蛋 麦克风 蓝牙K歌"; d="自带音响｜4种音效｜家庭KTV神器"; p=199; kw="karaoke microphone bluetooth speaker"}
    )
    # Smart home
    $smart = @(
        @{n="小米 智能摄像头 云台版 2K"; d="360°全景｜微光全彩｜AI人形追踪"; p=169; kw="xiaomi security camera 2k"},
        @{n="小米 智能门铃 3代 2K"; d="2K分辨率｜180°超广角｜变声对讲｜100天续航"; p=199; kw="xiaomi video doorbell smart"},
        @{n="小爱音箱 Pro 智能音箱"; d="DTS调音｜红外遥控家电｜蓝牙Mesh网关"; p=269; kw="xiaomi smart speaker alexa"},
        @{n="Google Nest Hub 2代 智能屏"; d="7寸触屏｜语音控制智能家居｜睡眠监测"; p=599; kw="google nest hub smart display"},
        @{n="涂鸦 智能插座 WiFi版 4个装"; d="语音/远程控制｜定时开关｜电量统计"; p=69; kw="smart wifi plug socket pack"},
        @{n="飞利浦 Hue 智能灯泡 彩光 2只装"; d="1600万色｜蓝牙Zigbee双模｜声控调光"; p=399; kw="philips hue smart bulb color"},
        @{n="米家 智能窗帘电机 WiFi版"; d="远程/语音/定时控制｜电量统计｜静音运行"; p=399; kw="smart curtain motor wifi home"},
        @{n="石头 扫地机器人 P10 Pro"; d="6000Pa吸力｜热水洗拖布｜AI避障建图"; p=2999; kw="roborock robot vacuum cleaner"},
        @{n="追觅 无线吸尘器 T30"; d="27000Pa吸力｜90min续航｜激光探尘"; p=1999; kw="dyson cordless vacuum cleaner"},
        @{n="戴森 空气净化器 HP09"; d="净化+暖风+凉风三合一｜HEPA滤网｜除甲醛"; p=4999; kw="dyson air purifier fan heater"}
    )
    # Photography & accessories
    $photo = @(
        @{n="大疆 Osmo Mobile 6 手机云台"; d="三轴增稳｜磁吸快装｜内置自拍杆"; p=749; kw="dji osmo mobile gimbal stabilizer"},
        @{n="大疆 Pocket 3 口袋相机"; d="1英寸CMOS｜4K120fps｜三轴云台｜Vlog神器"; p=3399; kw="dji pocket camera 4k"},
        @{n="GoPro HERO12 Black 运动相机"; d="5.3K60fps｜HyperSmooth6.0｜防水10米"; p=2999; kw="gopro hero action camera"},
        @{n="索尼 ZV-1 II Vlog相机"; d="1寸CMOS｜18-50mm变焦｜内置ND滤镜"; p=4999; kw="sony zv1 vlog camera"},
        @{n="佳能 EOS R50 微单相机 套机"; d="2420万APS-C｜4K30p｜人眼追踪对焦"; p=4499; kw="canon eos r50 mirrorless camera"},
        @{n="神牛 LED补光灯 SL60W"; d="5600K日光色温｜CRI96+高显指｜Bowens卡口"; p=399; kw="studio led light photography godox"},
        @{n="巅峰设计 相机背带 Slide Lite"; d="快速调节长度｜防滑肩垫｜承重90kg"; p=199; kw="camera strap peak design"},
        @{n="相机三脚架 碳纤维 反折 1.2kg"; d="碳纤维材质｜反折收纳｜360°全景云台"; p=499; kw="carbon fiber tripod camera"},
        @{n="闪迪 SD卡 Extreme Pro 128GB"; d="UHS-I U3 V30｜读速200MB/s｜4K视频专用"; p=129; kw="sandisk sd card extreme pro"},
        @{n="相机干燥箱 电子防潮柜 30L"; d="电子除湿｜湿度可调｜保存镜头防霉"; p=299; kw="camera dry cabinet dehumidifier"}
    )
    # Cables & adapters
    $cables = @(
        @{n="HDMI 2.1线 8K 超高速 3米"; d="48Gbps带宽｜8K60Hz/4K120Hz｜编织线"; p=49; kw="hdmi 2.1 cable 8k"},
        @{n="DP转HDMI线 4K60Hz 2米"; d="DisplayPort转HDMI｜双向互转｜镀金接口"; p=39; kw="displayport to hdmi cable adapter"},
        @{n="Type-C扩展坞 12合1"; d="HDMI4K+USB3.0*3+SD/TF+千兆网口+PD100W"; p=149; kw="usb c hub multiport adapter 12"},
        @{n="雷电4数据线 40Gbps 1米"; d="Intel认证｜8K视频｜100W供电｜苹果Mac必备"; p=159; kw="thunderbolt 4 cable 40gbps"},
        @{n="3.5mm音频线 公对公 5米"; d="镀金接头｜编织线｜音箱/车机连接"; p=29; kw="aux audio cable 3.5mm stereo"},
        @{n="网线 七类 万兆 屏蔽 3米"; d="10Gbps速率｜SSTP双屏蔽｜游戏低延迟"; p=25; kw="cat7 ethernet cable shielded"},
        @{n="电源延长线 3孔 3米"; d="新国标插座延长线｜3C认证｜阻燃"; p=35; kw="power extension cord 3 meter"},
        @{n="魔术贴理线带 20条装 多色"; d="可重复使用｜捆扎电脑线束｜桌面理线神器"; p=15; kw="cable management velcro ties"},
        @{n="桌面理线盒 大号 白色"; d="隐藏排插和线束｜桌下/桌上通用｜简洁桌面"; p=59; kw="cable management box desk white"},
        @{n="万能转换插头 全球通用 带USB"; d="覆盖200+国家｜双USB接口｜出国必备"; p=69; kw="universal travel adapter usb"}
    )
    $items += $phones; $items += $computer; $items += $audio; $items += $smart; $items += $photo; $items += $cables
    return $items
}

function Gen-Apparel {
    $items = @()
    # Men tops
    $menTop = @(
        @{n="优衣库 男装 圆领T恤 短袖 HEATTECH"; d="HEATTECH发热科技｜吸湿发热｜秋冬打底"; p=79; kw="uniqlo heattech t shirt men"},
        @{n="SELECTED 男装 商务衬衫 白色 修身"; d="100%埃及长绒棉｜免烫工艺｜修身版型"; p=399; kw="white dress shirt men formal"},
        @{n="太平鸟 男装 休闲衬衫 格子法兰绒"; d="纯棉法兰绒｜格子设计｜秋冬叠穿"; p=199; kw="flannel shirt checked men casual"},
        @{n="海澜之家 男装 POLO衫 纯色短袖"; d="新疆长绒棉｜珠地面料｜通勤百搭"; p=129; kw="polo shirt men cotton solid"},
        @{n="阿迪达斯 男装 运动T恤 速干"; d="AEROREADY速干科技｜透气网眼｜跑步健身"; p=149; kw="adidas sports t shirt men"},
        @{n="马克华菲 男装 卫衣 加绒 连帽"; d="加厚抓绒内里｜纯棉面料｜潮牌设计"; p=219; kw="hoodie men fleece cotton"},
        @{n="杰克琼斯 男装 针织衫 圆领 纯羊毛"; d="100%美丽诺羊毛｜细针12G｜商务休闲"; p=399; kw="merino wool sweater men knit"},
        @{n="Lilbetter 男装 潮流印花短袖T恤"; d="个性潮牌印花｜250g重磅棉｜宽松版"; p=99; kw="graphic t shirt men streetwear"}
    )
    # Men bottoms
    $menBot = @(
        @{n="优衣库 男装 弹力修身牛仔裤"; d="弹力面料｜修身直筒｜日本KAIHARA牛仔布"; p=249; kw="slim fit jeans men stretch"},
        @{n="太平鸟 男装 休闲裤 直筒 弹力"; d="四面弹力面料｜立体剪裁｜抗皱免烫"; p=199; kw="chino pants men straight fit"},
        @{n="阿迪达斯 男装 运动裤 束脚"; d="AEROREADY快干｜束脚设计｜运动休闲"; p=229; kw="adidas track pants joggers men"},
        @{n="李维斯 男装 501 经典直筒牛仔裤"; d="Levi's经典501版型｜美国进口｜养牛首选"; p=599; kw="levis 501 original jeans men"},
        @{n="始祖鸟 男装 户外速干长裤"; d="Gamma LT面料｜防泼水｜攀岩徒步"; p=1499; kw="arcteryx hiking pants men outdoor"},
        @{n="匡威 男装 工装裤 多口袋 束口"; d="纯棉工装风｜多口袋设计｜街头潮流"; p=269; kw="cargo pants men cotton streetwear"},
        @{n="GXG 男装 西裤 修身 九分"; d="弹力面料｜免烫抗皱｜商务通勤"; p=299; kw="dress pants men slim business"}
    )
    # Women tops
    $womenTop = @(
        @{n="优衣库 女装 圆领T恤 短袖 SUPIMA棉"; d="100%SUPIMA棉｜丝滑触感｜基础百搭款"; p=59; kw="supima cotton t shirt women basic"},
        @{n="乐町 女装 法式复古碎花衬衫"; d="雪纺面料｜蝴蝶结领结设计｜约会通勤"; p=189; kw="floral blouse women french style"},
        @{n="太平鸟 女装 荷叶边雪纺衫"; d="荷叶边领口｜垂感雪纺｜温柔甜美"; p=169; kw="ruffle blouse women chiffon"},
        @{n="ZARA 女装 针织开衫 短款 V领"; d="细针织法｜短款设计｜高腰搭配"; p=249; kw="cardigan sweater women knit cropped"},
        @{n="哥弟 女装 真丝衬衫 气质款"; d="100%桑蚕丝｜光泽质感｜高级通勤"; p=499; kw="silk blouse women elegant office"},
        @{n="ONLY 女装 卫衣 宽松 加绒"; d="加厚抓绒｜宽松BF风｜秋冬必备"; p=229; kw="sweatshirt women oversized fleece"},
        @{n="伊芙丽 女装 针织连衣裙 修身"; d="弹力罗纹针织｜修身版型｜凸显身材"; p=329; kw="knit dress women bodycon ribbed"},
        @{n="茵曼 女装 棉麻衬衫 宽松文艺"; d="天然棉麻面料｜防晒透气｜日系文艺范"; p=159; kw="linen shirt women loose casual"}
    )
    # Women bottoms
    $womenBot = @(
        @{n="伊芙丽 女装 阔腿裤 高腰 垂感"; d="高腰设计｜垂坠感面料｜显瘦神器"; p=269; kw="wide leg pants women high waist"},
        @{n="ONLY 女装 牛仔裤 小脚裤 弹力"; d="弹力面料｜提臀显瘦｜百搭款"; p=259; kw="skinny jeans women stretch high"},
        @{n="乐町 女装 A字半身裙 高腰"; d="A字版型｜显高显瘦｜学院风"; p=169; kw="a line skirt women high waist"},
        @{n="哥弟 女装 烟管裤 九分"; d="烟管裤型｜显瘦不紧绷｜职场女神首选"; p=349; kw="cigarette pants women slim office"},
        @{n="蕉下 女装 防晒长裤 UPF100+"; d="UPF100+防晒｜冰感凉感｜轻盈透气"; p=199; kw="sun protection pants women upf"},
        @{n="MAIA ACTIVE 女装 瑜伽裤 高腰"; d="高弹力Ex-stretch面料｜无缝工艺｜健身"; p=399; kw="yoga leggings women high waist active"}
    )
    # Unisex & accessories
    $acc = @(
        @{n="蕉下 防晒衣 男女通用 UPF100+"; d="UPF100+防晒｜冰感科技｜轻薄透气折叠"; p=179; kw="sun protection jacket upf men women"},
        @{n="优衣库 防晒外套 可收纳 男女通款"; d="UV Cut防晒科技｜轻薄可折叠｜随身携带"; p=149; kw="uv protection jacket packable"},
        @{n="匡威 帆布鞋 高帮 Chuck Taylor"; d="经典Chuck Taylor｜硫化底｜永不过时"; p=449; kw="converse chuck taylor high top"},
        @{n="Vans Old Skool 经典款 滑板鞋"; d="经典Sidestripe｜耐磨华夫底｜街头滑板"; p=499; kw="vans old skool sneakers classic"},
        @{n="NB 574 复古跑鞋 男女同款"; d="New Balance 574系列｜经典元祖灰｜舒适百搭"; p=599; kw="new balance 574 sneakers grey"},
        @{n="耐克 Air Force 1 '07 经典白"; d="全白AF1｜经典鞋型｜穿搭神器"; p=699; kw="nike air force 1 white sneakers"},
        @{n="猫人 中筒袜 精梳棉 10双装 男"; d="精梳棉｜弹力袜口｜商务休闲通用"; p=39; kw="cotton socks pack men crew"},
        @{n="浪莎 丝袜 超薄 5双装 肤色 女"; d="超薄5D｜防勾丝｜隐形肤色"; p=29; kw="pantyhose nude women sheer"},
        @{n="恒源祥 保暖内衣 加绒加厚 男"; d="阳离子发热面料｜加厚加绒｜寒冬必备"; p=89; kw="thermal underwear men fleece winter"},
        @{n="俞兆林 保暖内衣 加厚 女"; d="德绒发热科技｜不起球不缩水｜自发热"; p=79; kw="thermal underwear women fleece winter"},
        @{n="蕉内 内裤 莫代尔 3条装 男"; d="奥地利兰精莫代尔｜无痕腰带｜抑菌"; p=59; kw="boxer briefs men modal cotton"},
        @{n="曼妮芬 文胸 无钢圈 舒适 女"; d="无钢圈设计｜立体承托｜舒适无压"; p=129; kw="wireless bra women comfort seamless"}
    )
    # Outerwear
    $outer = @(
        @{n="波司登 羽绒服 中长款 90%鹅绒"; d="90%白鹅绒｜600+蓬松度｜防风防泼水"; p=899; kw="down jacket winter goose women"},
        @{n="优衣库 轻羽绒 便携式 男女通款"; d="ULTRALIGHT DOWN｜收纳口袋｜750+蓬松度"; p=399; kw="ultralight down jacket packable"},
        @{n="北面 冲锋衣 三合一 1996 Nuptse"; d="Gore-Tex防风防水｜可拆卸内胆｜经典款"; p=1999; kw="north face nuptse jacket"},
        @{n="始祖鸟 Beta AR 冲锋衣 男"; d="Gore-Tex Pro面料｜全天候防水｜攀岩登山"; p=5999; kw="arcteryx beta ar jacket goretex"},
        @{n="太平鸟 女装 呢大衣 双面呢 中长款"; d="100%羊毛双面呢｜手工缝制｜高级感"; p=799; kw="wool coat women double faced"},
        @{n="GXG 男装 呢大衣 单排扣 商务"; d="80%羊毛混纺｜单排扣设计｜通勤必备"; p=699; kw="wool coat men business casual"},
        @{n="蕉下 冲锋衣 男女同款 三防"; d="防水防风防油污｜透气透湿｜户外徒步"; p=399; kw="waterproof jacket outdoor hiking"},
        @{n="探索者 战术冲锋衣 软壳 加绒"; d="防风防泼水｜加厚加绒｜多口袋工装"; p=299; kw="tactical softshell jacket men"}
    )
    $items += $menTop; $items += $menBot; $items += $womenTop; $items += $womenBot; $items += $acc; $items += $outer
    return $items
}

function Gen-Groceries {
    $items = @()
    # Snacks
    $snacks = @(
        @{n="乐事 薯片 原味 大包 135g*3"; d="经典原味｜薄脆口感｜追剧必备"; p=29; kw="lays potato chips classic bag"},
        @{n="品客 薯片 洋葱酸奶油味 158g"; d="进口品客｜罐装不易碎｜酸奶油风味"; p=25; kw="pringles chips can sour cream"},
        @{n="奥利奥 夹心饼干 原味 388g"; d="经典黑白配｜扭一扭舔一舔｜家庭装"; p=19; kw="oreo cookies chocolate sandwich"},
        @{n="格力高 百奇 巧克力味 12袋装"; d="日本进口｜细棒饼干裹巧克力｜办公室零食"; p=35; kw="pocky chocolate sticks japanese snack"},
        @{n="三只松鼠 每日坚果 混合装 750g"; d="核桃腰果巴旦木蔓越莓｜科学配比｜30天装"; p=69; kw="mixed nuts dried fruit daily pack"},
        @{n="良品铺子 猪肉脯 原味 200g"; d="精选猪后腿肉｜古法炭烤｜独立小包装"; p=25; kw="pork jerky dried meat snack"},
        @{n="旺旺 仙贝 原味 400g 大礼包"; d="米香酥脆｜独立包装｜国民零食"; p=29; kw="rice cracker senbei japanese snack"},
        @{n="旺旺 雪饼 原味 400g 大礼包"; d="白雪般米饼｜酥脆清甜｜老少皆宜"; p=29; kw="rice cake snack cracker asian"},
        @{n="好丽友 派 巧克力味 12枚装"; d="巧克力涂层+棉花糖+蛋糕｜经典好丽友"; p=19; kw="chocolate pie snack cake marshmallow"},
        @{n="卫龙 辣条 大面筋 500g"; d="经典辣条｜香辣Q弹｜国民零食之光"; p=15; kw="latiao spicy snack strip chinese"}
    )
    # Pasta/Rice/Grains
    $grains = @(
        @{n="意大利面 Barilla 5号 500g*3"; d="意大利原装进口｜杜兰硬质小麦｜耐煮弹牙"; p=35; kw="barilla pasta spaghetti italian"},
        @{n="空刻 意面速食套装 番茄肉酱 270g*5"; d="15分钟出餐｜西餐厅级意面｜含酱料包"; p=59; kw="pasta meal kit tomato sauce"},
        @{n="十月稻田 东北大米 盘锦蟹田 5kg"; d="盘锦蟹田共生｜当季新米｜香甜软糯"; p=39; kw="japanese rice premium short grain bag"},
        @{n="柴火大院 五常大米 稻花香2号 5kg"; d="五常核心产区｜稻花香2号｜国标一级"; p=59; kw="premium rice wuchang grain bag"},
        @{n="十月稻田 三色糙米 1kg*3袋"; d="黑米+红米+糙米｜营养粗粮｜健身控糖"; p=29; kw="mixed brown rice grain healthy"},
        @{n="桂格 即食燕麦片 1kg*2袋"; d="全谷物燕麦｜免煮即食｜早餐冲饮"; p=35; kw="quaker oats instant oatmeal"},
        @{n="金龙鱼 多用途面粉 中筋 5kg"; d="精选小麦｜细腻洁白｜包子饺子面条"; p=25; kw="all purpose flour wheat baking bag"}
    )
    # Sauces & condiments
    $sauces = @(
        @{n="海天 酱油 金标生抽 1.9L"; d="非转基因大豆｜天然晒场酿造｜家庭大瓶装"; p=25; kw="soy sauce light chinese bottle"},
        @{n="李锦记 旧庄蚝油 510g"; d="上等鲜蚝熬制｜零添加防腐剂｜正宗粤式"; p=29; kw="oyster sauce premium chinese"},
        @{n="老干妈 风味豆豉油制辣椒 280g"; d="豆豉辣椒｜国民女神｜拌饭拌面神器"; p=15; kw="laoganma chili sauce black bean"},
        @{n="丘比 沙拉酱 蛋黄酱 400g"; d="日本配方｜香甜口味｜沙拉/三明治必备"; p=19; kw="kewpie mayonnaise japanese squeeze"},
        @{n="恒顺 镇江香醋 陈醋 500ml"; d="中国名醋｜糯米酿造｜1840年老字号"; p=15; kw="chinese black vinegar zhenjiang aged"},
        @{n="太太乐 鸡精 三鲜 454g"; d="含真实鸡汤｜复合鲜味｜炒菜调味"; p=19; kw="chicken bouillon powder seasoning"},
        @{n="海底捞 火锅底料 牛油麻辣 200g"; d="正宗川味火锅底料｜麻辣鲜香｜在家涮锅"; p=19; kw="hot pot soup base spicy sichuan"},
        @{n="饭爷 拌面酱 香辣牛肉味 210g"; d="超大牛肉粒｜川渝风味｜拌饭拌面一绝"; p=25; kw="noodle sauce spicy beef jar"}
    )
    # Drinks & beverage bases
    $drinks = @(
        @{n="川宁 伯爵红茶 茶包 2g*100包"; d="英国皇室御用｜佛手柑风味｜可做奶茶"; p=59; kw="twinings earl grey tea bags"},
        @{n="立顿 黄牌精选红茶 茶包 2g*100"; d="全球销量第一红茶品牌｜独立包装"; p=39; kw="lipton yellow label black tea bags"},
        @{n="艺福堂 西湖龙井 绿茶 200g"; d="西湖产区｜明前采摘｜中国十大名茶"; p=89; kw="longjing dragon well green tea"},
        @{n="小罐茶 铁观音 安溪清香 40g*5"; d="大师监制｜安溪原产｜独立氮气保鲜"; p=199; kw="tieguanyin oolong tea premium"},
        @{n="illy 咖啡豆 中度烘焙 250g"; d="意大利进口｜9种阿拉比卡拼配｜意式浓缩"; p=79; kw="illy coffee beans espresso medium roast"},
        @{n="星巴克 咖啡豆 深烘 佛罗娜 1.13kg"; d="门店同款｜深度烘焙｜黑巧克力焦糖风味"; p=169; kw="starbucks coffee beans verona dark"},
        @{n="Peet's 皮爷咖啡 胶囊 10颗*3盒"; d="Nespresso兼容｜中度烘焙｜迪克森少校"; p=129; kw="coffee capsules nespresso compatible"},
        @{n="AGF 咖啡液 焦糖风味 18颗"; d="日本进口浓缩咖啡液｜冷水/牛奶即溶"; p=49; kw="liquid coffee concentrate japanese"}
    )
    # Baking & desserts
    $baking = @(
        @{n="雀巢 炼乳 原味 380g"; d="经典炼乳｜蘸面包/做蛋糕｜越南咖啡伴侣"; p=12; kw="condensed milk sweetened can nestle"},
        @{n="安佳 黄油 无盐 454g 新西兰进口"; d="新西兰乳制品｜烘焙/煎牛排｜纯动物黄油"; p=45; kw="unsalted butter block new zealand"},
        @{n="总统 淡奶油 法国进口 1L"; d="法国诺曼底奶源｜烘焙打发｜35%乳脂"; p=49; kw="heavy cream whipping french cooking"},
        @{n="安琪 酵母粉 高活性 5g*30袋"; d="耐高糖高活性｜即发酵母｜面包馒头通用"; p=15; kw="instant yeast dry baking bread"},
        @{n="展艺 烘焙工具套装 新手入门 5件"; d="打蛋器+刮刀+量杯+筛网+油纸｜烘焙入门"; p=35; kw="baking tools kit beginner set"},
        @{n="可可粉 法芙娜 无糖 250g"; d="法国顶级可可品牌｜纯可可粉｜烘焙/冲饮"; p=89; kw="valrhona cocoa powder unsweetened"}
    )
    # International
    $intl = @(
        @{n="清净园 韩式辣酱 500g"; d="韩国进口｜石锅拌饭/炒年糕｜甜辣风味"; p=25; kw="gochujang korean chili paste"},
        @{n="妙多 泰国红咖喱酱 400g"; d="正宗泰式红咖喱｜椰奶咖喱鸡/牛必备"; p=22; kw="thai red curry paste cooking"},
        @{n="好侍 咖喱块 中辣 100g*5盒"; d="日式咖喱｜即食方便｜全家最爱的咖喱饭"; p=45; kw="japanese curry roux block house"},
        @{n="寿司海苔 50张 全型 烤紫菜"; d="日式寿司专用｜免洗即用｜120g"; p=25; kw="sushi nori seaweed sheets dried"},
        @{n="三岛 味噌酱 白味噌 750g"; d="日本进口｜大豆+米麴发酵｜味噌汤正宗配方"; p=35; kw="white miso paste japanese soybean"},
        @{n="越南米粉 即食河粉 鸡肉味 60g*12"; d="越南进口｜开水冲泡3分钟｜方便速食"; p=39; kw="vietnamese pho instant rice noodle"},
        @{n="德州扒鸡 五香脱骨 整只 500g"; d="中华老字号｜百年传承｜加热即食"; p=49; kw="braised chicken ready to eat chinese"},
        @{n="金华火腿 切片 即食 200g"; d="国家级非遗工艺｜36个月发酵｜火腿中的爱马仕"; p=129; kw="jinhua cured ham sliced chinese"},
        @{n="日本纳豆 极小粒 3盒装"; d="极小粒纳豆｜高蛋白｜健康发酵食品"; p=29; kw="natto fermented soybeans japanese"},
        @{n="韩国泡菜 辣白菜 1kg"; d="正宗韩式发酵泡菜｜下饭小菜｜做泡菜汤"; p=29; kw="kimchi korean fermented cabbage"}
    )
    $items += $snacks; $items += $grains; $items += $sauces; $items += $drinks; $items += $baking; $items += $intl
    return $items
}

function Gen-Home {
    $items = @()
    # Kitchen
    $kitchen = @(
        @{n="双立人 菜刀 切菜刀 中式 18cm"; d="德国进口不锈钢｜一体锻造｜锋利耐用"; p=299; kw="zwilling chef knife kitchen"},
        @{n="康宁 玻璃保鲜盒 5件套"; d="耐热玻璃｜冰箱/微波/烤箱/洗碗机通用"; p=129; kw="glass food storage container set"},
        @{n="双枪 筷子 竹筷 10双装"; d="天然楠竹｜无漆无蜡｜防霉处理"; p=19; kw="bamboo chopsticks set natural"},
        @{n="苏泊尔 不粘锅 炒锅 32cm 带盖"; d="麦饭石涂层｜电磁炉燃气通用｜少油烟"; p=199; kw="nonstick wok frying pan with lid"},
        @{n="卡罗特 麦饭石 汤锅 24cm"; d="加厚锅体｜不粘内壁｜炖汤煮面"; p=159; kw="soup pot nonstick ceramic kitchen"},
        @{n="双立人 刀具套装 6件套 带刀座"; d="德国不锈钢｜主厨刀+面包刀+多用刀+厨房剪"; p=599; zwilling knife block set kitchen"},
        @{n="象印 不锈钢保温壶 1.9L"; d="日本进口｜真空双层保温｜按压式出水"; p=269; kw="zojirushi thermal pot vacuum insulated"},
        @{n="虎牌 保温饭盒 2层 0.9L"; d="日本进口｜超强保温6小时｜自带筷子"; p=399; kw="tiger thermal lunch box bento japanese"},
        @{n="膳魔师 保温杯 500ml 不锈钢"; d="德国保温技术｜12小时保温｜一键弹盖"; p=179; kw="thermos vacuum flask bottle stainless"},
        @{n="特百惠 保鲜盒 10件套"; d="食品级PP材质｜密封防漏｜叠放收纳"; p=89; kw="tupperware food container set plastic"}
    )
    # Bathroom
    $bath = @(
        @{n="资生堂 沐浴露 可悠然 550ml"; d="日本进口｜温和清洁｜泡沫丰富细腻"; p=69; kw="shiseido body wash shower gel"},
        @{n="吕 洗发水 深层清洁 去屑 500ml"; d="韩国进口｜红参配方｜深层清洁去屑控油"; p=79; kw="ryo shampoo anti dandruff korean"},
        @{n="力士 沐浴露 恣情香氛 900ml"; d="含精油香氛｜持久留香｜大容量家庭装"; p=49; kw="lux body wash fragrant shower gel"},
        @{n="摩登主妇 牙刷架 免打孔 4口"; d="壁挂式｜紫外线杀菌｜自动挤牙膏"; p=59; kw="toothbrush holder wall mounted bathroom"},
        @{n="力邦 马桶刷 套装 壁挂"; d="壁挂沥水｜带底座｜不脏手"; p=19; kw="toilet brush set wall mounted bathroom"},
        @{n="大卫 刮水器 浴室刮水扫把 硅胶"; d="硅胶刮条｜不伤瓷砖地面｜快速刮水"; p=15; kw="silicone squeegee bathroom floor"},
        @{n="小林制药 马桶清洁剂 120g*6"; d="日本进口｜除菌除臭｜不伤釉面"; p=39; kw="toilet bowl cleaner tablet japanese"},
        @{n="洁丽雅 浴巾 纯棉 抗菌 70*140cm"; d="新疆长绒棉｜抗菌防螨｜超强吸水"; p=49; kw="cotton bath towel white large"}
    )
    # Bedroom & textiles
    $bed = @(
        @{n="水星家纺 四件套 纯棉 40支 1.5m床"; d="100%新疆棉｜活性印染｜不起球"; p=199; kw="cotton bedsheet set 4 piece double"},
        @{n="罗莱家纺 蚕丝被 二合一 1.5m床"; d="100%桑蚕丝｜子母被四季通用｜手工拉制"; p=699; kw="silk duvet comforter mulberry"},
        @{n="网易严选 乳胶枕 天然泰国乳胶"; d="93%天然乳胶含量｜人体工学曲线｜透气防螨"; p=169; kw="latex pillow thai natural ergonomic"},
        @{n="Muji 无印良品 凉感被 夏被 150x210"; d="冷感面料｜无需被套｜可水洗"; p=199; kw="cooling blanket summer quilt thin"},
        @{n="艾美特 电热毯 双人 双温双控"; d="双人双控｜6档调温｜定时除螨"; p=169; kw="electric blanket heated double bed"},
        @{n="天堂 遮光窗帘 全遮光 2片 2.7m"; d="100%物理遮光｜隔热隔音｜北欧简约"; p=129; kw="blackout curtains thermal insulated panel"},
        @{n="宜家 落地灯 简约 北欧风"; d="布艺灯罩｜暖光温馨｜客厅卧室"; p=149; kw="floor lamp nordic fabric shade"},
        @{n="小米 人体感应夜灯 2只装"; d="人体红外感应｜柔光不刺眼｜超长续航"; p=49; kw="motion sensor night light led"}
    )
    # Organization
    $org = @(
        @{n="倍思奇 收纳箱 前开式 66L 3个装"; d="前开翻盖｜可折叠｜加厚PP材质"; p=89; kw="storage box folding stackable plastic"},
        @{n="优思居 衣物收纳袋 真空压缩 6件套"; d="抽真空压缩｜节省80%空间｜配抽气泵"; p=39; kw="vacuum storage bags compression travel"},
        @{n="懒角落 鞋盒 翻盖式 12个装"; d="透明翻盖｜可叠放｜防潮防尘"; p=69; kw="shoe storage box clear stackable"},
        @{n="懒角落 厨房置物架 多层 落地"; d="加厚碳钢｜4层可调｜锅具微波炉收纳"; p=89; kw="kitchen shelf rack storage organizer"},
        @{n="优思居 化妆品收纳盒 带盖 防尘"; d="透明亚克力｜三层带抽屉｜桌面整洁"; p=39; kw="acrylic makeup organizer drawer cosmetic"},
        @{n="太力 真空压缩袋 免抽气 6件套"; d="手压排气免抽气泵｜防霉防潮｜旅行必备"; p=29; kw="compression packing cubes travel space"}
    )
    # Home decor
    $decor = @(
        @{n="宜家 相框 10个装 白色 21x30cm"; d="轻巧挂墙/摆台｜黑白双色可选"; p=39; kw="picture frame white set wall decor"},
        @{n="月球灯 3D打印 16cm 暖白 可充电"; d="3D打印月球纹理｜触控调光｜浪漫礼物"; p=69; kw="moon lamp 3d printed led night"},
        @{n="MUJI 香薰机 超声波 300ml"; d="超声波雾化｜定时关闭｜无印同款"; p=169; kw="ultrasonic aroma diffuser essential oil"},
        @{n="绿植 龟背竹 盆栽 含盆 50cm"; d="北欧风网红绿植｜空气净化｜好养"; p=45; kw="monstera plant potted indoor tropical"},
        @{n="人工花卉 仿真花 客厅装饰 12支"; d="仿真玫瑰花｜不需打理｜永久鲜艳"; p=29; kw="artificial flowers fake rose bouquet"},
        @{n="墙上装饰 挂毯 波西米亚风 80x100"; d="北欧波西米亚｜棉线编织｜拍照背景墙"; p=49; kw="macrame wall hanging tapestry boho"},
        @{n="精油套装 6瓶 10ml"; d="薰衣草+甜橙+薄荷+柠檬+茶树+尤加利｜香薰"; p=39; kw="essential oils set aromatherapy 6 pack"},
        @{n="灭蚊灯 紫外线 捕蚊 孕妇婴儿"; d="物理灭蚊｜无烟无毒｜静音运行"; p=49; kw="mosquito killer lamp uv insect trap"}
    )
    # Cleaning
    $clean = @(
        @{n="戴森 V15 无绳吸尘器"; d="240AW吸力｜激光探测灰尘｜60min续航"; p=3999; kw="dyson v15 cordless vacuum cleaner"},
        @{n="追觅 扫地机器人 S10 Pro"; d="自清洁拖布｜LDS激光导航｜5300Pa吸力"; p=2499; kw="robot vacuum mop self cleaning"},
        @{n="必胜 洗地机 吸拖一体 3.0"; d="吸拖一体｜一键自清洁｜干湿垃圾一次搞掂"; p=999; kw="wet dry vacuum floor cleaner cordless"},
        @{n="妙洁 拖把 平板免手洗 干湿两用"; d="免手洗｜360°旋转｜干湿两用"; p=49; kw="flat mop self wringing floor cleaning"},
        @{n="花王 衣物除菌液 替换装 810ml"; d="日本进口｜99.9%除菌｜婴幼儿可用"; p=35; kw="laundry sanitizer disinfectant liquid"},
        @{n="蓝月亮 洗衣液 薰衣草香 3kg"; d="深层洁净｜温和不伤手｜持久留香"; p=49; kw="laundry detergent liquid lavender"},
        @{n="威猛先生 厨房清洁剂 重油污 500ml"; d="除重油污｜不伤厨具表面｜厨房清洁神器"; p=25; kw="kitchen degreaser cleaner heavy duty"},
        @{n="滴露 消毒液 750ml"; d="英国进口｜医用级消毒｜衣物家居通用"; p=49; kw="dettol disinfectant liquid antiseptic"}
    )
    $items += $kitchen; $items += $bath; $items += $bed; $items += $org; $items += $decor; $items += $clean
    return $items
}

function Gen-Lifestyle {
    $items = @()
    # Fitness
    $fitness = @(
        @{n="李宁 跑步鞋 超轻 男款"; d="超轻EVA中底｜透气飞织鞋面｜日常慢跑"; p=299; kw="li ning running shoes lightweight men"},
        @{n="安踏 篮球鞋 KT9 克莱汤普森"; d="氮科技中底｜碳板抗扭｜实战篮球"; p=599; kw="anta basketball shoes klay thompson"},
        @{n="特步 竞速跑鞋 160X 3.0 碳板"; d="全掌碳板｜超临界发泡中底｜马拉松竞速"; p=799; kw="carbon plate running shoes marathon"},
        @{n="匹克 态极 拖鞋 男女同款"; d="态极自适应科技｜踩屎感｜浴室可穿"; p=99; kw="sports slides sandals cloud cushion"},
        @{n="瑜伽垫 加厚加宽 TPE 183x80cm"; d="双层TPE｜10mm加厚｜双面防滑纹理"; p=79; kw="yoga mat thick tpe large exercise"},
        @{n="Keep 健腹轮 自动回弹 智能计数"; d="APP互联计数｜智能回弹｜核心训练"; p=89; kw="ab roller wheel automatic rebound"},
        @{n="哑铃 可调节 快调 20kg 一对"; d="一秒换重｜2-20kg｜不伤地板"; p=459; kw="adjustable dumbbell set quick change"},
        @{n="弹力带 阻力带 套装 5条 不同拉力"; d="5种拉力｜天然乳胶｜配收纳袋"; p=39; kw="resistance bands set exercise workout"},
        @{n="筋膜枪 深层按摩 6档 8按摩头"; d="专业级无刷电机｜6档调速｜Type-C充电"; p=159; kw="massage gun deep tissue muscle percussive"},
        @{n="TRX 悬挂训练带 门扣版"; d="美国原版｜全身抗阻训练｜随时随地健身"; p=149; kw="trx suspension trainer straps home gym"},
        @{n="健腹轮 升级款 宽轮 自动回弹"; d="加宽加厚不侧翻｜自动回弹｜静音滚轮"; p=59; kw="ab wheel roller wide stability core"},
        @{n="半指手套 健身 举重 防滑 男/女"; d="加厚掌垫｜透气网布｜防滑耐磨"; p=29; kw="gym gloves workout weightlifting grip"},
        @{n="Reebok 踏步机 家用 迷你 静音"; d="液压阻力｜液晶显示｜瘦腿提臀"; p=299; kw="stepper machine mini home cardio"},
        @{n="Keep 动感单车 C1 磁控 静音"; d="磁控阻力｜APP课程｜居家骑行"; p=1499; kw="spin bike indoor cycling magnetic home"}
    )
    # Outdoor
    $outdoor = @(
        @{n="牧高笛 露营帐篷 3-4人 双层"; d="自动速开｜防风防雨｜户外露营必备"; p=299; kw="camping tent 4 person pop up outdoor"},
        @{n="挪客 睡袋 信封式 羽绒 0°C"; d="羽绒填充｜信封式可拼接｜轻量便携"; p=199; kw="sleeping bag down mummy camping"},
        @{n="探路者 冲锋衣 男/女 三合一"; d="可拆卸内胆｜防风防水透气｜登山徒步"; p=599; kw="hiking jacket waterproof 3 in 1 outdoor"},
        @{n="骆驼 登山杖 碳纤维 超轻 一对"; d="3K碳纤维｜仅180g/根｜四节伸缩折叠"; p=169; kw="trekking poles carbon fiber hiking pair"},
        @{n="探路者 徒步背包 50L 带防雨罩"; d="50L大容量｜透气背负系统｜多仓分区"; p=229; kw="hiking backpack 50l outdoor travel bag"},
        @{n="挪客 野餐垫 防水防潮 200x200"; d="加厚防潮｜可折叠收纳｜户外野餐必备"; p=49; kw="picnic mat blanket waterproof outdoor large"},
        @{n="牧高笛 折叠椅 铝合金 轻量"; d="7075航空铝合金｜仅重800g｜承重120kg"; p=129; kw="camping chair folding lightweight aluminum"},
        @{n="原始人 户外折叠桌 铝合金 中号"; d="铝合金桌面｜折叠收纳｜配收纳包"; p=99; kw="camping table folding portable aluminum"},
        @{n="烧烤炉 户外 便携 折叠 不锈钢"; d="不锈钢烤网｜折叠收纳｜3-5人烧烤"; p=89; kw="portable bbq grill charcoal folding outdoor"},
        @{n="太阳能露营灯 10000mAh 3档调光"; d="太阳能+USB双充｜10000mAh充电宝｜防水"; p=59; kw="solar camping lantern rechargeable led"},
        @{n="户外水壶 钛合金 750ml"; d="TA1纯钛｜仅重110g｜无异味耐腐蚀"; p=239; kw="titanium water bottle ultralight hiking"},
        @{n="急救包 户外家庭应急 210件套"; d="210件急救用品｜防水收纳包｜户外必备"; p=59; kw="first aid kit emergency medical 200 piece"}
    )
    # Travel
    $travel = @(
        @{n="小米 90分 旅行箱 20寸 登机箱"; d="德国拜耳PC材质｜TSA密码锁｜万向轮"; p=299; kw="carry on luggage 20 inch spinner hardside"},
        @{n="外交官 拉杆箱 24寸 万向轮"; d="铝框加固｜TSA海关锁｜PC+ABS材质"; p=499; kw="luggage 24 inch spinner hardside travel"},
        @{n="旅行收纳袋 防水 6件套"; d="衣物分装｜防水面料｜出差打包神器"; p=29; kw="packing cubes travel organizer set"},
        @{n="充气旅行枕 U型 按压充气"; d="按压30秒充气｜慢回弹记忆棉｜收纳小巧"; p=39; kw="travel neck pillow inflatable u shaped"},
        @{n="MUJI 无印良品 旅行分装瓶 6件套"; d="化妆品分装瓶｜防漏设计｜小于100ml登机"; p=29; kw="travel bottles toiletry containers set"},
        @{n="行李箱保护套 弹性 24-28寸通用"; d="弹力面料｜防刮花｜多种图案可选"; p=25; kw="luggage cover protector elastic suitcase"},
        @{n="护照套 旅行钱包 RFID防盗刷"; d="RFID防盗刷｜防水面料｜多卡位"; p=39; kw="passport holder rfid blocking travel wallet"},
        @{n="眼罩 真丝 3D遮光 睡眠"; d="100%桑蚕丝｜3D立体不压眼｜飞机/居家"; p=29; kw="silk sleep mask eye mask 3d contoured"}
    )
    # Personal care
    $care = @(
        @{n="飞利浦 电动牙刷 HX6853 声波"; d="31000次/分声波震动｜3种模式｜2支替换头"; p=299; kw="philips sonicare electric toothbrush rechargeable"},
        @{n="Oral-B 电动牙刷 Pro 1000"; d="3D前后震动｜压力感应｜德国制造"; p=199; kw="oral b electric toothbrush pro"},
        @{n="松下 冲牙器 便携式 EW1511"; d="喷射水流｜牙缝清洁｜充电式防水"; p=329; kw="water flosser portable cordless dental"},
        @{n="小米 鼻毛修剪器 防水 充电式"; d="双刃刀头｜IPX7防水｜Type-C充电"; p=49; kw="nose hair trimmer electric waterproof"},
        @{n="飞科 剃须刀 三刀头 全身水洗 男士"; d="三刀头浮动｜智能防夹须｜1小时快充"; p=129; kw="electric shaver rotary men rechargeable"},
        @{n="戴森 吹风机 Supersonic"; d="数码马达｜智能温控｜快速干发不伤发"; p=2999; kw="dyson supersonic hair dryer"},
        @{n="松下 吹风机 纳米水离子 1800W"; d="nanoe纳米水离子｜润护秀发｜恒温护发"; p=599; kw="panasonic hair dryer nanoe ionic"},
        @{n="直白 卷发棒 负离子 陶瓷 32mm"; d="千万级负离子｜陶瓷釉涂层｜不伤发质"; p=129; kw="curling iron ceramic ionic hair styler"}
    )
    # Sports accessories
    $sportAcc = @(
        @{n="小米手环 8 Pro 1.74寸AMOLED"; d="独立GPS｜150+运动模式｜血氧心率监测"; p=399; kw="xiaomi smart band fitness tracker"},
        @{n="佳明 运动手表 Forerunner 255"; d="双频多星GPS｜训练建议｜铁人三项"; p=2399; kw="garmin forerunner running watch"},
        @{n="运动水壶 不锈钢 真空保温 1000ml"; d="316不锈钢｜12小时保温｜24小时保冷"; p=89; kw="stainless steel water bottle insulated sport"},
        @{n="止汗带 运动头带 吸汗 男女通用"; d="超细纤维吸水｜防滑硅胶条｜跑步篮球"; p=19; kw="sweatband headband sports running"},
        @{n="运动护膝 半月板保护 髌骨带"; d="加压防护｜弹簧支撑｜跑步/篮球/健身"; p=39; kw="knee brace compression support sports"},
        @{n="护腕 运动 加压 透气 2只装"; d="加压腕带｜透气弹力｜举重/篮球"; p=19; kw="wrist brace support wrap sports"},
        @{n="泳镜 专业 防雾 近视可配度数"; d="高清防雾｜UV防护｜可配左右不同度数"; p=69; kw="swimming goggles anti fog prescription"},
        @{n="泳帽 硅胶 防水 长头发适用"; d="硅胶防水｜立体设计｜护耳不勒头"; p=25; kw="silicone swim cap waterproof long hair"}
    )
    $items += $fitness; $items += $outdoor; $items += $travel; $items += $care; $items += $sportAcc
    return $items
}

# ============ MAIN ============

$merchants = @(
    @{id=3; name="merchant_hyc Store"; desc="跨境电商精选 — 全球好物直邮到家，正品保证"; contact="020-8888-0001"},
    @{id=4; name="数码先锋"; desc="智能数码产品专卖 — 手机、电脑、平板、耳机，科技改变生活"; contact="010-1001-0001"},
    @{id=5; name="时尚衣橱"; desc="潮流服饰鞋包 — 精选品牌好货，穿出你的风格"; contact="0571-6666-0001"},
    @{id=6; name="美味生活"; desc="全球美食严选 — 进口零食、茶饮、粮油调味，舌尖上的环球旅行"; contact="021-5555-0001"},
    @{id=7; name="家居精品"; desc="品质家居生活馆 — 厨具、家纺、收纳、清洁，让生活更美好"; contact="0755-3333-0001"},
    @{id=8; name="运动达人"; desc="运动户外装备一站购 — 跑步、健身、露营、骑行，点燃你的运动激情"; contact="028-7777-0001"}
)

$categoryMerchantMap = @{
    "Beverages" = 6
    "Electronics" = 4
    "Apparel" = 5
    "Groceries" = 6
    "Home" = 7
    "Lifestyle" = 8
}

$stockDefaults = @{
    "Beverages" = @(80,300)
    "Electronics" = @(20,150)
    "Apparel" = @(50,400)
    "Groceries" = @(60,500)
    "Home" = @(30,200)
    "Lifestyle" = @(25,300)
}

$allProducts = @()
$allProducts += (Gen-Beverages | ForEach-Object { $_ | Add-Member -NotePropertyName "category" -NotePropertyValue "Beverages" -PassThru })
$allProducts += (Gen-Electronics | ForEach-Object { $_ | Add-Member -NotePropertyName "category" -NotePropertyValue "Electronics" -PassThru })
$allProducts += (Gen-Apparel | ForEach-Object { $_ | Add-Member -NotePropertyName "category" -NotePropertyValue "Apparel" -PassThru })
$allProducts += (Gen-Groceries | ForEach-Object { $_ | Add-Member -NotePropertyName "category" -NotePropertyValue "Groceries" -PassThru })
$allProducts += (Gen-Home | ForEach-Object { $_ | Add-Member -NotePropertyName "category" -NotePropertyValue "Home" -PassThru })
$allProducts += (Gen-Lifestyle | ForEach-Object { $_ | Add-Member -NotePropertyName "category" -NotePropertyValue "Lifestyle" -PassThru })

Write-Host "Total products generated: $($allProducts.Count)"

# Categories distribution
$allProducts | Group-Object category | ForEach-Object { Write-Host "  $($_.Name): $($_.Count)" }

# Generate SQL INSERT
$sqlFile = "$env:USERPROFILE\Desktop\CA_Team4\SpringBoot_CA\tmp\insert-products.sql"
New-Item -ItemType Directory -Force -Path (Split-Path $sqlFile) | Out-Null
"START TRANSACTION;" | Out-File $sqlFile -Encoding UTF8

$count = 0
foreach ($p in $allProducts) {
    $cat = $p.category
    $mid = $categoryMerchantMap[$cat]
    $merchant = $merchants | Where-Object { $_.id -eq $mid } | Select-Object -First 1
    $stockRange = $stockDefaults[$cat]
    $stock = Get-Random -Minimum $stockRange[0] -Maximum $stockRange[1]
    $lowStock = [Math]::Min(5, [Math]::Max(1, [int]($stock * 0.05)))

    $safeName = $p.n -replace "'", "''"
    $safeDesc = $p.d -replace "'", "''"
    $safeMName = $merchant.name -replace "'", "''"
    $safeMDesc = $merchant.desc -replace "'", "''"
    $safeContact = $merchant.contact -replace "'", "''"

    # Using NOW() + random offset for created_at diversity
    $dayOffset = Get-Random -Minimum 0 -Maximum 30
    $sql = "INSERT INTO products (name, category, description, price, stock_quantity, low_stock_threshold, sales_count, active, image_url, merchant_id, merchant_name, merchant_description, merchant_contact, created_at) VALUES ('$safeName', '$cat', '$safeDesc', $($p.p), $stock, $lowStock, 0, 1, NULL, $mid, '$safeMName', '$safeMDesc', '$safeContact', DATE_SUB(NOW(), INTERVAL $dayOffset DAY));"
    Add-Content -Path $sqlFile -Value $sql -Encoding UTF8
    $count++
}

"COMMIT;" | Out-File $sqlFile -Encoding UTF8 -Append
Write-Host "`nSQL file written: $count INSERT statements"

# Execute SQL
Write-Host "Inserting into database..."
docker exec -i smart-commerceops-mysql-1 mysql -uroot -pcommerceops catalog_db --default-character-set=utf8mb4 < $sqlFile 2>$null
$totalAfter = docker exec smart-commerceops-mysql-1 mysql -uroot -pcommerceops catalog_db -N -e "SELECT COUNT(*) FROM products;" 2>/dev/null | Select-Object -Last 1
Write-Host "Total products in DB: $totalAfter"

# Write keyword mapping file for image migration
$kwFile = "$env:USERPROFILE\Desktop\CA_Team4\SpringBoot_CA\tmp\product-keywords.csv"
"id,name,category,keyword" | Out-File $kwFile -Encoding UTF8
$startId = 110  # After existing 109 products
$idx = 0
foreach ($p in $allProducts) {
    $id = $startId + $idx
    $line = "$id,$($p.n -replace ',','，'),$($p.category),$($p.kw)"
    Add-Content -Path $kwFile -Value $line -Encoding UTF8
    $idx++
}
Write-Host "Keyword mapping file: $kwFile ($idx products)"

# Output the mapping as JSON for next step
$kwJson = @{}
$idx = 0
foreach ($p in $allProducts) {
    $id = $startId + $idx
    $kwJson["$id"] = $p.kw
    $idx++
}
$kwFile2 = "$env:USERPROFILE\Desktop\CA_Team4\SpringBoot_CA\tmp\keywords.json"
$kwJson | ConvertTo-Json | Out-File $kwFile2 -Encoding UTF8
Write-Host "Keywords JSON: $kwFile2"
Write-Host "`n=== DONE: $count products inserted ==="
