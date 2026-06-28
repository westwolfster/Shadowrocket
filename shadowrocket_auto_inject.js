/**
 * 小火箭文本专属高级脚本：动态拉取指定机场订阅 + 精准国别分类 + 优雅拼装小火箭配置
 * 适用场景：Sub-store 文件管理 (Files) 挂载 小火箭 .conf 模板
 * 接收参数示例：name=ikuuu_singbox
 */
async function operator(proxies = [], targetPlatform, context) {
  const { name } = $arguments;

  if (!name) {
    console.log("[小火箭国别分组] 错误：未在参数中检测到 name，请配置 Argument 栏为 name=你的订阅名");
    return $files[0];
  }

  // 1. 读取当前文件管理中的小火箭 .conf 文本内容
  let content = $files[0];

  try {
    // 2. 异步拉取指定的订阅节点（针对小火箭，拉取标准明文节点）
    let rawProxies = await produceArtifact({
      name: name,
      type: "subscription",
      platform: "shadowrocket", // 显式声明为小火箭格式
      produceType: "internal",
    });

    if (!rawProxies || rawProxies.length === 0) {
      throw new Error("机场订阅返回节点数为 0 或获取失败");
    }

    console.log(`[小火箭国别分组] 成功拉取到订阅 [${name}] 的节点共计: ${rawProxies.length} 个`);

    // 3. 将拉取到的内部节点流，转换洗净为小火箭标准的【节点名 = 协议详解】纯文本行
    // Sub-store 在处理 shadowrocket 平台时，每个节点对象可以直接调用 .toString() 导出小火箭单行标准语法
    let proxyLines = [];
    let allNodeTags = [];
    
    // 国别存储池（存储节点名字）
    const hkNodes = [], sgNodes = [], jpNodes = [], krNodes = [], usNodes = [], otherNodes = [];
    
    // 国别关键字匹配规则
    const REGEX_HK = /(香港|HK|Hong Kong|HongKong|Hkg)/i;
    const REGEX_SG = /(新加坡|SG|Singapore|Sgp)/i;
    const REGEX_JP = /(日本|JP|Japan|东京|大阪|Jpn)/i;
    const REGEX_KR = /(韩国|KR|Korea|首尔|Kor)/i;
    const REGEX_US = /(美国|US|United States|America|Usa)/i;

    rawProxies.forEach(p => {
      if (!p || !p.tag) return;
      
      // 生成类似: 🇯🇵 日本原生 = ss, 1.2.3.4, 443, ... 的小火箭纯文本节点行
      let line = p.toString();
      if (line) {
        proxyLines.push(line);
        allNodeTags.push(p.tag);

        // 归类标签
        if (REGEX_HK.test(p.tag)) hkNodes.push(p.tag);
        else if (REGEX_SG.test(p.tag)) sgNodes.push(p.tag);
        else if (REGEX_JP.test(p.tag)) jpNodes.push(p.tag);
        else if (REGEX_KR.test(p.tag)) krNodes.push(p.tag);
        else if (REGEX_US.test(p.tag)) usNodes.push(p.tag);
        else otherNodes.push(p.tag);
      }
    });

    // 4. 将提取出的实体节点纯文本，精准塞入模板中的 [Proxy] 节点区块下
    const proxyBlockText = proxyLines.join("\n");
    content = content.replace("[Proxy]", `[Proxy]\n${proxyBlockText}`);

    // 5. 动态替换 [Proxy Group] 策略组中的占位符
    // 为防止策略组为空导致报错，如果机场没有该国别节点，用 DIRECT（直连）或者其他节点名字兜底
    const cleanGroup = (nodes) => nodes.length > 0 ? nodes.join(", ") : "DIRECT";

    content = content.replace("Auto = url-test", `Auto = url-test, ${allNodeTags.join(", ")}`);
    content = content.replace("AI-Auto = url-test", `AI-Auto = url-test, ${cleanGroup([...sgNodes, ...jpNodes, ...krNodes, ...usNodes])}`);
    content = content.replace("香港 (HK) = url-test", `香港 (HK) = url-test, ${cleanGroup(hkNodes)}`);
    content = content.replace("新加坡 (SG) = url-test", `新加坡 (SG) = url-test, ${cleanGroup(sgNodes)}`);
    content = content.replace("日本 (JP) = url-test", `日本 (JP) = url-test, ${cleanGroup(jpNodes)}`);
    content = content.replace("韩国 (KR) = url-test", `韩国 (KR) = url-test, ${cleanGroup(krNodes)}`);
    content = content.replace("美国 (US) = url-test", `美国 (US) = url-test, ${cleanGroup(usNodes)}`);
    content = content.replace("其它地区 = url-test", `其它地区 = url-test, ${cleanGroup(otherNodes)}`);

    console.log("[小火箭国别分组] 文本策略组注入及实体节点注入完美成功！");

  } catch (e) {
    console.log(`[小火箭国别分组·安全避险] 注入失败: ${e.message}。输出原始模板。`);
  }

  // 6. 最终向小火箭输出纯文本配置文件
  return content;
}
