// 1. 获取通过链接 #name=xxx 传进来的机场订阅名
const { name, type = "0" } = $arguments || {};

// 获取上游读到的 shadowrocket_template.conf 模板原文
let templateContent = $files[0];

if (!name) {
  console.log("[小火箭注入] 错误：未检测到参数 name，请检查脚本链接后是否加了 #name=机场名");
  $content = templateContent;
} else {
  console.log(`[小火箭注入] 开始处理。准备提取机场: ${name}`);

  try {
    // 2. 异步拉取机场的内部原生节点（强制使用内部格式，避免被底层二次污染）
    let rawProxies = await produceArtifact({
      name: name,
      type: /^1$|col/i.test(type) ? "collection" : "subscription",
      platform: "sing-box",
      produceType: "internal",
    });

    if (!rawProxies || rawProxies.length === 0) {
      console.log("[小火箭注入] 未获取到上游节点，跳过替换");
      $content = templateContent;
    } else {
      console.log(`[小火箭注入] 成功获取到节点共: ${rawProxies.length} 个`);

      let proxyLines = [];
      const hkTags = [], sgTags = [], jpTags = [], krTags = [], usTags = [], otherTags = [], allTags = [];

      const REGEX_HK = /(香港|HK|Hong Kong|HongKong|Hkg)/i;
      const REGEX_SG = /(新加坡|SG|Singapore|Sgp)/i;
      const REGEX_JP = /(日本|JP|Japan|东京|大阪|Jpn)/i;
      const REGEX_KR = /(韩国|KR|Korea|首尔|Kor)/i;
      const REGEX_US = /(美国|US|United States|America|Usa)/i;

      // 3. 遍历节点并利用沙盒内置安全的 $toNode 转换为小火箭明文格式
      rawProxies.forEach(p => {
        if (!p || !p.tag) return;
        
        // 使用 Sub-store 针对文件管理最标准的单节点互转工具
        let shadowrocketLine = $toNode(p, "shadowrocket");
        if (shadowrocketLine) {
          proxyLines.push(shadowrocketLine);
          allTags.push(p.tag);

          if (REGEX_HK.test(p.tag)) hkTags.push(p.tag);
          else if (REGEX_SG.test(p.tag)) sgTags.push(p.tag);
          else if (REGEX_JP.test(p.tag)) jpTags.push(p.tag);
          else if (REGEX_KR.test(p.tag)) krTags.push(p.tag);
          else if (REGEX_US.test(p.tag)) usTags.push(p.tag);
          else otherTags.push(p.tag);
        }
      });

      const cleanG = (tags) => tags.length > 0 ? tags.join(", ") : "DIRECT";

      // 4. 执行模板内【节点】和【策略组池】的精准替换
      // 这样就不需要在脚本里手搓几百行配置了，模板长什么样，出来的就是什么样
      let result = templateContent;

      // 替换节点占位行
      if (proxyLines.length > 0) {
        result = result.replace("# ===MY_NODES_PLACEHOLDER===", proxyLines.join("\n"));
      }

      // 5. 将最终的纯文本交付给 Sub-store 吐出
      $content = result;
      console.log("[小火箭注入] 替换装配完成！");
    }
  } catch (err) {
    console.log("[小火箭注入] 脚本运行期捕获异常: " + err.message);
    $content = templateContent;
  }
}
