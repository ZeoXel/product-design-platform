#!/usr/bin/env python3
"""
产品设计台 - 实际应用场景演示
展示从用户需求到设计产出的完整流程
"""
import asyncio
from services.embedding_service import embedding_service
from services.gallery_service import gallery_service

# ANSI 颜色代码
class Color:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Color.BOLD}{Color.CYAN}{'='*70}{Color.END}")
    print(f"{Color.BOLD}{Color.CYAN}{text:^70}{Color.END}")
    print(f"{Color.BOLD}{Color.CYAN}{'='*70}{Color.END}\n")

def print_section(text):
    print(f"\n{Color.BOLD}{Color.BLUE}▶ {text}{Color.END}")
    print(f"{Color.BLUE}{'─'*70}{Color.END}")

def print_user(text):
    print(f"{Color.YELLOW}👤 客户: {Color.END}{text}")

def print_designer(text):
    print(f"{Color.GREEN}🎨 设计师: {Color.END}{text}")

def print_system(text):
    print(f"{Color.CYAN}🤖 系统: {Color.END}{text}")

def print_result(emoji, text):
    print(f"{Color.GREEN}{emoji} {text}{Color.END}")


async def scenario_1():
    """场景1：设计师快速灵感匹配"""
    print_header("场景 1：设计师快速灵感查找")

    print_section("背景")
    print("🏢 工作室：手工饰品设计工作室")
    print("👤 角色：产品设计师 小美")
    print("⏰ 时间：周一上午 10:00")
    print("📋 任务：为新客户设计一款夏日耳环")

    print_section("客户需求（来自微信）")
    print_user("""
    "我想要一款适合海边度假的耳环
     清爽一点的，不要太重
     预算 200 元左右
     喜欢贝壳、珍珠那种天然感觉"
    """)

    print_section("传统工作流程 ❌")
    print(f"{Color.RED}⏱️  翻看实体样品册: 20分钟{Color.END}")
    print(f"{Color.RED}📸 拍照发给客户: 5分钟{Color.END}")
    print(f"{Color.RED}💬 来回沟通确认: 30分钟{Color.END}")
    print(f"{Color.RED}⏰ 总计: 55分钟{Color.END}")

    print_section("使用产品设计台 ✅")

    # 步骤1: 输入需求
    print_designer("让我用设计台快速找参考...")
    print()
    query = "夏天 海边 清爽 贝壳 珍珠 轻盈 度假风"
    print_system(f'收到查询: "{query}"')

    # 步骤2: 生成向量
    print_system("正在分析语义特征...")
    query_emb = await embedding_service.generate_embedding("", query)
    print_result("✓", f"已生成 {query_emb.shape[0]} 维语义向量")

    # 步骤3: 向量检索
    print_system("在 100+ 款历史作品中检索...")
    results = await gallery_service.find_similar(query_emb, top_k=5, threshold=0.3)

    print_result("🎯", f"找到 {len(results)} 款相似设计")

    # 步骤4: 展示结果
    print()
    print_section("推荐设计（按相关度排序）")

    for i, item in enumerate(results, 1):
        analysis = item['item'].get('analysis', {})
        tags = analysis.get('style', {}).get('tags', [])
        mood = analysis.get('style', {}).get('mood', '')

        bar = "█" * int(item['similarity'] * 50)
        print(f"\n  {Color.BOLD}#{i} 相关度 {item['similarity']:.1%}{Color.END} {bar}")
        print(f"     风格: {' '.join(tags)} | {mood}")
        print(f"     图片: {item['imageUrl']}")

        if i == 1:
            print(f"     {Color.GREEN}👍 最推荐这款！{Color.END}")

    # 步骤5: 成本估算
    print()
    print_section("自动成本分析")
    print_result("💰", "材料成本: ¥35 (贝壳 ¥8 + 珍珠 ¥18 + 五金 ¥9)")
    print_result("⏱️", "制作工时: 1.5小时")
    print_result("💵", "建议售价: ¥180-220 (符合客户预算)")

    # 总结
    print()
    print_section("对比结果")
    print(f"{Color.GREEN}⏰ 设计台用时: 3分钟{Color.END}")
    print(f"{Color.GREEN}📈 效率提升: 18倍{Color.END}")
    print(f"{Color.GREEN}🎯 精准度: 基于100+款真实作品{Color.END}")

    print()
    print_designer("太棒了！直接把第1款发给客户，她肯定喜欢！")


async def scenario_2():
    """场景2：新手设计师学习模仿"""
    print_header("场景 2：新手设计师快速成长")

    print_section("背景")
    print("🏢 场景：新入职设计师")
    print("👤 角色：实习生 小王（入职第3天）")
    print("📋 任务：第一次独立设计流苏耳环")

    print_section("当前困境")
    print_user("""
    小王内心独白：
    "老师说要做流苏耳环，但我不知道：
     - 流苏应该几层？
     - 每层间距多少？
     - 用什么颜色搭配？
     - 五金件怎么选？"
    """)

    print_section("使用产品设计台学习")

    # 步骤1: 上传参考图
    print_designer("我先找一张网上看到的流苏耳环图...")
    print_system("收到上传图片")

    # 步骤2: AI 分析
    print_system("正在分析设计结构...")
    await asyncio.sleep(0.5)

    print()
    print_result("🔍", "识别结果：")
    print("""
      主要元素:
        • 流苏 (3层设计)
        • 珍珠 (6mm 白色)
        • 金属扣 (玫瑰金)

      结构分析:
        • 第1层: 5根流苏, 长度 3cm
        • 第2层: 7根流苏, 长度 4cm
        • 第3层: 9根流苏, 长度 5cm
        • 层间距: 0.8cm

      风格标签:
        • 温柔 • 优雅 • 渐变 • 轻盈
    """)

    # 步骤3: 找相似设计学习
    print()
    print_system("查找工作室类似的成功案例...")

    query = "流苏 三层 渐变 温柔 优雅"
    query_emb = await embedding_service.generate_embedding("", query)
    results = await gallery_service.find_similar(query_emb, top_k=3, threshold=0.3)

    print_result("📚", f"找到 {len(results)} 个相似的成功案例供学习")

    for i, item in enumerate(results[:3], 1):
        analysis = item['item'].get('analysis', {})
        print(f"\n  案例 {i}: 相似度 {item['similarity']:.0%}")
        print(f"    → 查看详细制作步骤")
        print(f"    → 查看材料清单")
        print(f"    → 查看客户评价 ⭐⭐⭐⭐⭐")

    # 步骤4: 设计建议
    print()
    print_section("AI 设计建议")
    print_result("💡", "基于 50+ 款流苏作品分析：")
    print("""
      1. 颜色搭配建议:
         • 粉白渐变 (销量最好, 复购率 78%)
         • 金色系 (适合职场, 客单价高 20%)

      2. 工艺优化:
         ✓ 使用鱼线代替金属丝 → 更轻盈, 不坠耳
         ✓ 三层改为二层 → 降低成本 30%, 不影响效果

      3. 定价策略:
         • 二层款: ¥120-150 (走量款)
         • 三层款: ¥180-220 (精品款)
    """)

    print()
    print_section("学习成果")
    print_designer("""
    "太有用了！我现在知道：
     ✓ 具体的尺寸参数
     ✓ 材料选择的理由
     ✓ 定价的市场依据
     ✓ 客户喜欢什么风格

     以前要问老师 10 遍，现在自己就能搞定！"
    """)

    print_result("📈", "新手设计师成长周期: 3个月 → 2周")


async def scenario_3():
    """场景3：客户定制快速报价"""
    print_header("场景 3：定制需求快速响应")

    print_section("背景")
    print("📱 场景：客户发来定制咨询")
    print("⏰ 时间：晚上 8:30 (下班后)")
    print("👤 角色：工作室老板 阿雅")

    print_section("客户消息（微信）")
    print_user("""
    [图片] (客户发来一张 Pinterest 上的耳环图)

    "老板，我想做一对和这个类似的
     但是要粉色系的
     还要加一点珍珠
     大概多少钱？什么时候能做好？"
    """)

    print_section("传统响应方式 ❌")
    print(f"{Color.RED}😰 内心OS: 下班了，明天再回吧...{Color.END}")
    print(f"{Color.RED}⏰ 响应时间: 第二天上午{Color.END}")
    print(f"{Color.RED}😟 客户流失风险: 30% (等不及去其他家){Color.END}")

    print_section("使用产品设计台 ✅")

    # 步骤1: 手机端快速操作
    print_designer("打开手机版设计台...")
    print_system("欢迎回来，阿雅 👋")

    # 步骤2: 上传客户图片
    print_designer("上传客户发的图片...")
    print_system("正在分析...")
    await asyncio.sleep(0.5)

    print()
    print_result("🔍", "识别客户想要的风格：")
    print("     • 多层流苏")
    print("     • 金属链条")
    print("     • 简约现代")

    # 步骤3: 调整需求
    print()
    print_designer("调整参数: 颜色改为粉色, 加珍珠元素")
    print_system("重新检索...")

    query = "流苏 粉色 珍珠 链条 简约 现代"
    query_emb = await embedding_service.generate_embedding("", query)
    results = await gallery_service.find_similar(query_emb, top_k=3, threshold=0.3)

    # 步骤4: 智能报价
    print()
    print_result("💰", "自动成本核算：")
    print("""
      材料成本:
        • 粉色流苏丝线: ¥12
        • 天然珍珠 (4颗): ¥25
        • 玫瑰金链条: ¥8
        • 耳钩五金: ¥6
        ────────────────
        小计: ¥51

      人工成本:
        • 预计工时: 2小时
        • 工时费: ¥60

      建议报价: ¥180-200
      制作周期: 3-4 天
    """)

    # 步骤5: 发送效果图
    print()
    print_section("快速响应客户")
    print_designer("找到了 3 款相似的参考图，发给客户...")

    for i, item in enumerate(results[:3], 1):
        print(f"\n  {Color.CYAN}图片 {i}{Color.END}: 相似度 {item['similarity']:.0%}")
        print(f"    {item['imageUrl']}")

    print()
    print_designer("""
    发送消息给客户:

    "亲，刚看到消息！帮你找了几款类似的 [图片][图片][图片]
     按你的要求：粉色+珍珠
     价格 180-200 之间
     4天左右能做好

     喜欢哪款告诉我，明天就开工 😊"
    """)

    print()
    print_section("客户反馈")
    print_user("""
    "哇，好快！第2款超喜欢！
     就要这个，明天能付款吗？"
    """)

    print()
    print_section("对比结果")
    print(f"{Color.GREEN}⏰ 响应时间: 3分钟 (vs 次日){Color.END}")
    print(f"{Color.GREEN}💰 成交率: +40%{Color.END}")
    print(f"{Color.GREEN}😊 客户满意度: ⭐⭐⭐⭐⭐{Color.END}")
    print(f"{Color.GREEN}📱 随时随地处理: 手机/平板/电脑{Color.END}")


async def scenario_4():
    """场景4：批量设计优化"""
    print_header("场景 4：数据驱动的设计优化")

    print_section("背景")
    print("🏢 场景：准备双十一新品")
    print("📅 时间：提前 2 个月规划")
    print("👤 角色：工作室创始人 Lisa")
    print("🎯 目标：设计 20 款爆款产品")

    print_section("传统设计方式 ❌")
    print(f"{Color.RED}🎲 凭经验拍脑袋{Color.END}")
    print(f"{Color.RED}😰 不知道哪款会火{Color.END}")
    print(f"{Color.RED}💸 备货风险高{Color.END}")

    print_section("数据驱动的设计流程 ✅")

    # 步骤1: 分析历史数据
    print()
    print_designer("打开产品设计台，查看历史销售数据...")
    print_system("正在分析 500+ 历史订单...")
    await asyncio.sleep(0.5)

    print()
    print_result("📊", "数据洞察：")
    print("""
      热销风格 TOP 3:

      1. 简约珍珠系列
         • 销量: 237件
         • 复购率: 68%
         • 客单价: ¥156
         • 主要标签: 简约 温柔 日常 百搭
         ▶ 建议: 继续推新款 ✓

      2. 流苏耳环系列
         • 销量: 189件
         • 复购率: 45%
         • 客单价: ¥198
         • 主要标签: 优雅 浪漫 约会 仙气
         ▶ 建议: 扩充颜色款 ✓

      3. 金属极简系列
         • 销量: 134件
         • 复购率: 72%
         • 客单价: ¥88
         • 主要标签: 现代 职场 冷淡 高级
         ▶ 建议: 入门款首选 ✓
    """)

    # 步骤2: 智能推荐新款
    print()
    print_section("AI 新款推荐")

    print_system("基于销售数据 + 市场趋势分析...")
    print()

    # 模拟推荐几个设计方向
    recommendations = [
        {
            "direction": "珍珠系列新款",
            "query": "简约 珍珠 温柔 日常",
            "reason": "热销系列，复购率高",
            "expected_sales": "预计销量 200+件"
        },
        {
            "direction": "流苏渐变色系",
            "query": "流苏 渐变 粉色 浪漫",
            "reason": "流苏类目增长 30%，粉色系最受欢迎",
            "expected_sales": "预计销量 150+件"
        },
        {
            "direction": "金属几何组合",
            "query": "金属 几何 线条 现代",
            "reason": "客单价低易转化，适合引流",
            "expected_sales": "预计销量 180+件"
        }
    ]

    for i, rec in enumerate(recommendations, 1):
        print_result("💡", f"方向 {i}: {rec['direction']}")
        print(f"     推荐理由: {rec['reason']}")
        print(f"     {rec['expected_sales']}")

        # 快速检索参考
        query_emb = await embedding_service.generate_embedding("", rec['query'])
        results = await gallery_service.find_similar(query_emb, top_k=2, threshold=0.3)

        print(f"     参考设计: {len(results)} 款历史爆款")
        print()

    # 步骤3: 成本优化
    print()
    print_section("成本优化建议")
    print_result("📉", "批量采购材料可降低成本:")
    print("""
      • 珍珠 (500颗以上): 单价 ¥3.2 → ¥2.1 (-34%)
      • 流苏线 (批量): 单价 ¥2.5 → ¥1.3 (-48%)
      • 五金配件: 单价 ¥1.5 → ¥0.8 (-47%)

      预计整体成本降低: 35%
    """)

    # 步骤4: 定价策略
    print()
    print_section("智能定价策略")
    print_result("💰", "根据市场数据推荐定价:")
    print("""
      入门款 (金属几何): ¥68-88
        → 吸引新客，提高转化

      主打款 (珍珠系列): ¥138-168
        → 利润款，走量

      高端款 (流苏定制): ¥198-258
        → 提升品牌形象
    """)

    # 总结
    print()
    print_section("最终成果")
    print_result("🎯", "设计方向明确: 20 款新品规划完成")
    print_result("💰", "成本可控: 预计降低 35%")
    print_result("📈", "预期销量: 1500+ 件")
    print_result("⏰", "决策时间: 2小时 (vs 传统 2周)")

    print()
    print_designer("""
    "以前都是拍脑袋设计，做完才知道好不好卖
     现在有数据支撑，每一款都是爆款胚子！
     备货也更有底气了 💪"
    """)


async def scenario_5():
    """场景5：跨平台灵感整合"""
    print_header("场景 5：设计灵感一站式管理")

    print_section("背景")
    print("👤 角色：自由设计师 小林")
    print("📱 日常：刷小红书、Pinterest、Instagram 找灵感")
    print("😰 痛点：看到好设计，保存了 1000+ 张图，找不到！")

    print_section("传统灵感管理 ❌")
    print(f"{Color.RED}📱 小红书收藏 312 张{Color.END}")
    print(f"{Color.RED}📌 Pinterest 图板 487 张{Color.END}")
    print(f"{Color.RED}📸 手机相册 653 张{Color.END}")
    print(f"{Color.RED}😫 想找某个风格的图 → 翻半小时找不到{Color.END}")

    print_section("使用产品设计台整合 ✅")

    # 步骤1: 批量导入
    print()
    print_designer("把所有平台的图片导入设计台...")
    print_system("批量分析中...")
    await asyncio.sleep(0.5)

    print()
    print_result("✓", "已导入 1,452 张灵感图")
    print_result("🏷️", "自动识别并打标签")
    print_result("🔍", "建立智能检索索引")

    # 步骤2: 智能搜索
    print()
    print_section("1个月后...")
    print_designer("客户想要「复古宫廷风」的耳环，我记得之前收藏过...")

    print()
    print_designer('在搜索框输入: "复古 宫廷 华丽"')

    query = "复古 宫廷 华丽"
    query_emb = await embedding_service.generate_embedding("", query)
    results = await gallery_service.find_similar(query_emb, top_k=5, threshold=0.2)

    print_system("检索 1,452 张图片...")
    await asyncio.sleep(0.3)

    print()
    print_result("🎯", f"找到 {min(len(results), 5)} 张相关灵感图")

    for i, item in enumerate(results[:5], 1):
        analysis = item['item'].get('analysis', {})
        tags = analysis.get('style', {}).get('tags', [])
        print(f"\n  {i}. 相关度 {item['similarity']:.0%}")
        print(f"     来源: Instagram (2个月前保存)")
        print(f"     标签: {' '.join(tags)}")

    print()
    print_designer("找到了！就是这张！当时在 INS 看到的 ✨")

    # 步骤3: 灵感组合
    print()
    print_section("灵感重组创新")
    print_designer("我想把这个「复古感」和「流苏元素」结合...")

    print()
    print_designer('搜索: "流苏 + 复古"')

    query2 = "流苏 复古 华丽"
    query_emb2 = await embedding_service.generate_embedding("", query2)
    results2 = await gallery_service.find_similar(query_emb2, top_k=3, threshold=0.2)

    print_system("智能组合检索...")
    print()
    print_result("💡", "发现 3 个创新灵感:")
    print("""
      1. 复古流苏 × 珍珠吊坠
         → 融合了宫廷感和现代流苏

      2. 金属雕花 × 流苏组合
         → 上半部分复古，下半部分现代

      3. 复古耳钩 × 简约流苏
         → 细节复古，整体简约
    """)

    # 总结
    print()
    print_section("价值体现")
    print_result("⚡", "查找速度: 3秒 (vs 30分钟)")
    print_result("🎨", "跨平台整合: 统一管理")
    print_result("💡", "智能推荐: 发现新组合")
    print_result("📊", "数据沉淀: 个人灵感库")

    print()
    print_designer("""
    "现在我的所有灵感都在这里
     不管是 3 个月前还是 1 年前保存的
     只要输入关键词，秒出结果！

     而且系统会推荐我从没想过的组合
     设计效率翻倍！🚀"
    """)


async def main():
    """运行所有场景演示"""
    scenarios = [
        ("场景 1", scenario_1, "设计师快速灵感匹配 - 55分钟变3分钟"),
        ("场景 2", scenario_2, "新手快速成长 - 3个月变2周"),
        ("场景 3", scenario_3, "定制快速响应 - 成交率提升40%"),
        ("场景 4", scenario_4, "数据驱动设计 - 爆款命中率翻倍"),
        ("场景 5", scenario_5, "灵感整合管理 - 1452张图秒查"),
    ]

    print(f"\n{Color.BOLD}{Color.HEADER}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║                                                                    ║")
    print("║              🎨 产品设计台 - 实际应用场景演示 🎨                 ║")
    print("║                                                                    ║")
    print("║         从设计灵感到成本核算，一站式解决方案                      ║")
    print("║                                                                    ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(f"{Color.END}\n")

    print(f"{Color.BOLD}选择要查看的场景:{Color.END}\n")
    for i, (name, _, desc) in enumerate(scenarios, 1):
        print(f"  {i}. {desc}")
    print(f"  0. 播放全部场景\n")

    choice = input(f"{Color.CYAN}请输入序号 (0-{len(scenarios)}): {Color.END}")

    try:
        choice = int(choice)
        if choice == 0:
            for _, func, _ in scenarios:
                await func()
                input(f"\n{Color.YELLOW}按回车继续下一场景...{Color.END}\n")
        elif 1 <= choice <= len(scenarios):
            await scenarios[choice - 1][1]()
        else:
            print(f"{Color.RED}无效选择{Color.END}")
    except ValueError:
        print(f"{Color.RED}请输入数字{Color.END}")
    except KeyboardInterrupt:
        print(f"\n{Color.YELLOW}演示已取消{Color.END}")

    print(f"\n{Color.BOLD}{Color.GREEN}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║                                                                    ║")
    print("║                   演示结束，感谢观看！                             ║")
    print("║                                                                    ║")
    print("║  💡 这就是 AI 驱动的产品设计台的价值：                            ║")
    print("║     • 效率提升 10-20 倍                                           ║")
    print("║     • 成本节约 30-50%                                             ║")
    print("║     • 数据驱动决策                                                ║")
    print("║     • 随时随地办公                                                ║")
    print("║                                                                    ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(f"{Color.END}\n")

if __name__ == "__main__":
    asyncio.run(main())
