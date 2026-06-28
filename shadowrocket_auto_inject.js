/**
 * 终极兼容版：动态拉取订阅 (对齐 sing-box 通道) + 纯文本转换 + 小火箭策略组精准注入
 * 适用场景：Sub-store 文件管理 (Files) 挂载 小火箭 .conf 模板
 * 接收参数示例：name=ikuuu_singbox
 */
async function operator(proxies = [], targetPlatform, context) {
  const { name } = $arguments;

  if (!name) {
    console.log("[小火箭国别分组] 错误：未在参数中检测到 name，请配置 Argument 栏为 name=你的订阅名");
    return $files[0];
  }

  // 1. 读取当前文件管理中的小火箭 .conf 纯文本内容
  let content = $files[0];

  try {
    // 2. 【核心修正】完全对齐 merge_all.js 成功范例，采用最稳健的 sing-box 内部格式拉取节点
    let rawProxies = await produceArtifact({
      name: name,
      type: "subscription",
      platform: "sing-box", // 保持内部最稳定的数据管道
      produceType: "internal",
    });

    if (!rawProxies || rawProxies.length === 0) {
      throw new Error("从 Sub-store 内部通道获取到的节点数为 0，请确认该机场订阅本身刷新有节点");
    }

    console.log(`[小火箭国别分组] 成功拉取到订阅 [${name}] 的节点共计: ${rawProxies.length} 个`);

    // 3. 定义小火箭专用的纯文本存储容器与国别 tag 分类池
    let proxyLines = [];
    const hkNodes = [], sgNodes = [], jpNodes = [], krNodes = [], usNodes = [], otherNodes = [], allNodeTags = [];
    
    // 国别关键字匹配规则（忽略大小写）
    const REGEX_HK = /(香港|HK|Hong Kong|HongKong|Hkg)/i;
    const REGEX_SG = /(新加坡|SG|Singapore|Sgp)/i;
    const REGEX_JP = /(日本|JP|Japan|东京|大阪|Jpn)/i;
    const REGEX_KR = /(韩国|KR|Korea|首尔|Kor)/i;
    const REGEX_US = /(美国|US|United States|America|Usa)/i;

    // 4. 遍历节点流
    rawProxies.forEach(p => {
      if (!p || !p.tag) return;
      
      // 【核心转换】利用高级 API 动态调用小火箭的独立渲染器，将内部节点洗成小火箭单行纯文本
      // 类似渲染出：🇯🇵 日本原生 = ss, 1.2.3.4, 443, ...
      let shadowrocketLine = SubStore.Script.Util.PROXY.stringify(p, "shadowrocket");
      
      if (shadowrocketLine) {
        proxyLines.push(shadowrocketLine);
        allNodeTags.push(p.tag);

        // 精准划分国别标签池
        if (REGEX_HK.test(p.tag)) hkNodes.push(p.tag);
        else if (REGEX_SG.test(p.tag)) sgNodes.push(p.tag);
        else if (REGEX_JP.test(p.tag)) jpNodes.push(p.tag);
        else if (REGEX_KR.test(p.tag)) krNodes.push(p.tag);
        else if (REGEX_US.test(p.tag)) usNodes.push(p.tag);
        else otherNodes.push(p.tag);
      }
    });

    // 5. 将拼装洗净的小火箭单行实体节点纯文本，精准填入 [Proxy] 区块下
    if (proxyLines.length > 0) {
      const proxyBlockText = proxyLines.join("\n");
      content = content.replace("[Proxy]", `[Proxy]\n${proxyBlockText}`);
    }

    // 6. 动态替换并补全 [Proxy Group] 策略组中的空缺占位符
    const cleanGroup = (nodes) => nodes.length > 0 ? nodes.join(", ") : "DIRECT";

    content = content.replace("Auto = url-test", `Auto = url-test, ${allNodeTags.join(", ")}`);
    content = content.replace("AI-Auto = url-test", `AI-Auto = url-test, ${cleanGroup([...sgNodes, ...jpNodes, ...krNodes, ...usNodes])}`);
    content = content.replace("香港 (HK) = url-test", `香港 (HK) = url-test, ${cleanGroup(hkNodes)}`);
    content = content.replace("新加坡 (SG) = url-test", `新加坡 (SG) = url-test, ${cleanGroup(sgNodes)}`);
    content = content.replace("日本 (JP) = url-test", `日本 (JP) = url-test, ${cleanGroup(jpNodes)}`);
    content = content.replace("韩国 (KR) = url-test", `韩国 (KR) = url-test, ${cleanGroup(krNodes)}`);
    content = content.replace("美国 (US) = url-test", `美国 (US) = url-test, ${cleanGroup(usNodes)}`);
    content = content.replace("其它地区 = url-test", `其它地区 = url-test, ${cleanGroup(otherNodes)}`);

    console.log("[小火箭国别分组] 策略组及文本实体节点注入成功！");

  } catch (e) {
    console.log(`[小火箭国别分组·安全避险] 运行遭遇阻碍: ${e.message}。返回原始文本。`);
  }

  // 7. 向小火箭输出处理完毕的最终 .conf 纯文本
  return content;
}
