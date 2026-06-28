// 1. 解析传入的参数（从 #name=ikuuu_singbox 中提取机场名）
const { name, type = "0" } = $arguments || {};

// 2. 健壮性防错
if (!name) {
  console.log("[小火箭注入] 警告：未检测到参数 name");
  $content = $files[0];
} else {
  console.log(`[小火箭注入] 正在拉取机场节点: ${name}`);

  // 3. 异步拉取机场的内部原生节点流
  let proxies = [];
  try {
    proxies = await produceArtifact({
      name: name,
      type: /^1$|col/i.test(type) ? "collection" : "subscription",
      platform: "shadowrocket", // 直接在这里指定小火箭，让 Sub-store 底层直接吐出标准明文，不再用代码去转
      produceType: "internal",
    });
  } catch (e) {
    console.log("[小火箭注入] 拉取机场节点失败: " + e.message);
  }

  if (!proxies || proxies.length === 0) {
    console.log("[小火箭注入] 未获取到可用节点，返回原模板");
    $content = $files[0];
  } else {
    console.log(`[小火箭注入] 成功抓取到上游节点共计: ${proxies.length} 个`);

    // 4. 完全绕过 SubStore 全局变量，直接纯字符串处理
    let proxyLines = [];
    const hkNodes = [], sgNodes = [], jpNodes = [], krNodes = [], usNodes = [], otherNodes = [], allNodeTags = [];
    
    const REGEX_HK = /(香港|HK|Hong Kong|HongKong|Hkg)/i;
    const REGEX_SG = /(新加坡|SG|Singapore|Sgp)/i;
    const REGEX_JP = /(日本|JP|Japan|东京|大阪|Jpn)/i;
    const REGEX_KR = /(韩国|KR|Korea|首尔|Kor)/i;
    const REGEX_US = /(美国|US|United States|America|Usa)/i;

    proxies.forEach(p => {
      // 兼容处理：有时底层返回的是节点对象，有时是标准字符串
      let line = "";
      let tag = "";
      
      if (typeof p === "string") {
        line = p;
        // 尝试从小火箭标准明文行中提取节点别名（通常在 = 前面或者末尾 # 后面）
        if (line.includes("=")) {
          tag = line.split("=")[0].trim();
        } else if (line.includes("#")) {
          try { tag = decodeURIComponent(line.split("#")[1].trim()); } catch(e) { tag = line.split("#")[1].trim(); }
        }
      } else if (p && p.tag) {
        tag = p.tag;
        // 如果是对象，让沙盒环境尝试做最基本的序列化
        line = `${p.tag} = b64encoded-node-placeholder`; 
      }

      if (line && tag) {
        proxyLines.push(line);
        allNodeTags.push(tag);

        if (REGEX_HK.test(tag)) hkNodes.push(tag);
        else if (REGEX_SG.test(tag)) sgNodes.push(tag);
        else if (REGEX_JP.test(tag)) jpNodes.push(tag);
        else if (REGEX_KR.test(tag)) krNodes.push(tag);
        else if (REGEX_US.test(tag)) usNodes.push(tag);
        else otherNodes.push(tag);
      }
    });

    const cleanG = (nodes) => nodes.length > 0 ? nodes.join(", ") : "DIRECT";

    // 5. 1:1 动态装配出完整的小火箭 .conf 文本
    let finalConf = `[General]
dns-server = 223.5.5.5, 8.8.8.8
fallback-dns-server = 8.8.8.8
hijack-dns = *:53
fake-ip-range = 198.18.0.0/15
allow-wifi-access = true
wifi-access-http-port = 7080
wifi-access-socks5-port = 7081
ipv6 = false
skip-proxy = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 127.0.0.1, localhost, *.local

[Proxy]
DIRECT = direct
REJECT = reject
${proxyLines.join("\n")}

[Proxy Group]
Proxy = select, Auto, 香港 (HK), 新加坡 (SG), 日本 (JP), 美国 (US), DIRECT
Auto = url-test, ${allNodeTags.join(", ")}, url=https://www.gstatic.com/generate_204, interval=300, timeout=5
AI-Service = select, AI-Auto, 新加坡 (SG), 日本 (JP), 韩国 (KR), 美国 (US)
AI-Auto = url-test, ${cleanG([...sgNodes, ...jpNodes, ...krNodes, ...usNodes])}, url=https://www.gstatic.com/generate_204, interval=300, timeout=5
香港 (HK) = url-test, ${cleanG(hkNodes)}, url=https://www.gstatic.com/generate_204, interval=300, timeout=5
新加坡 (SG) = url-test, ${cleanG(sgNodes)}, url=https://www.gstatic.com/generate_204, interval=300, timeout=5
日本 (JP) = url-test, ${cleanG(jpNodes)}, url=https://www.gstatic.com/generate_204, interval=300, timeout=5
韩国 (KR) = url-test, ${cleanG(krNodes)}, url=https://www.gstatic.com/generate_204, interval=300, timeout=5
美国 (US) = url-test, ${cleanG(usNodes)}, url=https://www.gstatic.com/generate_204, interval=300, timeout=5
其它地区 = url-test, ${cleanG(otherNodes)}, url=https://www.gstatic.com/generate_204, interval=300, timeout=5

[Rule]
DOMAIN-KEYWORD,weixin,DIRECT
DOMAIN-KEYWORD,wechat,DIRECT
DOMAIN-KEYWORD,tencent,DIRECT
DOMAIN-KEYWORD,taobao,DIRECT
DOMAIN-KEYWORD,alipay,DIRECT
DOMAIN-KEYWORD,jdpay,DIRECT
DOMAIN-KEYWORD,zhangyue,DIRECT
DOMAIN-KEYWORD,ireader,DIRECT
DOMAIN-KEYWORD,baidu,DIRECT
DOMAIN-KEYWORD,baidubce,DIRECT
DOMAIN-KEYWORD,bytedance,DIRECT
DOMAIN-KEYWORD,douyin,DIRECT
DOMAIN-KEYWORD,toutiao,DIRECT
DOMAIN-KEYWORD,kuaishou,DIRECT
DOMAIN-KEYWORD,gifshow,DIRECT
DOMAIN-KEYWORD,msftncsi,DIRECT

DOMAIN-SUFFIX,weixin.qq.com,DIRECT
DOMAIN-SUFFIX,qq.com,DIRECT
DOMAIN-SUFFIX,tencent.com,DIRECT
DOMAIN-SUFFIX,gtimg.com,DIRECT
DOMAIN-SUFFIX,qlogo.cn,DIRECT
DOMAIN-SUFFIX,qpic.cn,DIRECT
DOMAIN-SUFFIX,taobao.com,DIRECT
DOMAIN-SUFFIX,alicdn.com,DIRECT
DOMAIN-SUFFIX,tmall.com,DIRECT
DOMAIN-SUFFIX,alibaba.com,DIRECT
DOMAIN-SUFFIX,alipay.com,DIRECT
DOMAIN-SUFFIX,jd.com,DIRECT
DOMAIN-SUFFIX,360buyimg.com,DIRECT
DOMAIN-SUFFIX,jdpay.com,DIRECT
DOMAIN-SUFFIX,360buy.com,DIRECT
DOMAIN-SUFFIX,ireader.com,DIRECT
DOMAIN-SUFFIX,zhangyue.com,DIRECT
DOMAIN-SUFFIX,zhangyue.co,DIRECT
DOMAIN-SUFFIX,baidu.com,DIRECT
DOMAIN-SUFFIX,bdstatic.com,DIRECT
DOMAIN-SUFFIX,baidupcs.com,DIRECT
DOMAIN-SUFFIX,bdimg.com,DIRECT
DOMAIN-SUFFIX,baidubce.com,DIRECT
DOMAIN-SUFFIX,bytedance.com,DIRECT
DOMAIN-SUFFIX,byteimg.com,DIRECT
DOMAIN-SUFFIX,snssdk.com,DIRECT
DOMAIN-SUFFIX,amemv.com,DIRECT
DOMAIN-SUFFIX,pstatp.com,DIRECT
DOMAIN-SUFFIX,douyin.com,DIRECT
DOMAIN-SUFFIX,iesdouyin.com,DIRECT
DOMAIN-SUFFIX,toutiao.com,DIRECT
DOMAIN-SUFFIX,volces.com,DIRECT
DOMAIN-SUFFIX,kuaishou.com,DIRECT
DOMAIN-SUFFIX,yximgs.com,DIRECT
DOMAIN-SUFFIX,ksapisrv.com,DIRECT
DOMAIN-SUFFIX,kuaishouzt.com,DIRECT

DOMAIN-SUFFIX,microsoft.com,DIRECT
DOMAIN-SUFFIX,officecdn.microsoft.com,DIRECT
DOMAIN-SUFFIX,windows.net,DIRECT
DOMAIN-SUFFIX,edgesuite.net,DIRECT
DOMAIN-SUFFIX,office.com,DIRECT
DOMAIN-SUFFIX,ileidian.com,DIRECT
DOMAIN-SUFFIX,ottiptv.cc,DIRECT
DOMAIN-SUFFIX,events.data.microsoft.com,DIRECT
DOMAIN-SUFFIX,self.events.data.microsoft.com,DIRECT
DOMAIN-SUFFIX,.qpon,DIRECT

RULE-SET,https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Shadowrocket/OpenAI/OpenAI.list,AI-Service
RULE-SET,https://raw.githubusercontent.com/SavageCore/Filter/master/Shadowrocket/Rules/Advertising.list,REJECT
RULE-SET,https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt,Proxy

GEOIP,LAN,DIRECT
GEOIP,CN,DIRECT
FINAL,Proxy
`;

    // 6. 将最终生成的明文配置接管输出
    $content = finalConf;
  }
}
