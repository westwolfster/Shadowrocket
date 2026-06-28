/**
 * 订阅级高级脚本（纯文本输出修正版）
 * 适用场景：Sub-store「订阅管理」-> 类型选「文件」或「文本」-> 来源选你的机场 -> 挂载此脚本
 */
function operator(proxies = [], targetPlatform, context) {
  if (!proxies || proxies.length === 0) {
    console.log("[小火箭重组] 错误：未接收到节点流");
    return "error: no proxies received";
  }

  console.log(`[小火箭重组] 成功接收节点共计: ${proxies.length} 个`);

  let proxyLines = [];
  const hkNodes = [], sgNodes = [], jpNodes = [], krNodes = [], usNodes = [], otherNodes = [], allNodeTags = [];
  
  const REGEX_HK = /(香港|HK|Hong Kong|HongKong|Hkg)/i;
  const REGEX_SG = /(新加坡|SG|Singapore|Sgp)/i;
  const REGEX_JP = /(日本|JP|Japan|东京|大阪|Jpn)/i;
  const REGEX_KR = /(韩国|KR|Korea|首尔|Kor)/i;
  const REGEX_US = /(美国|US|United States|America|Usa)/i;

  proxies.forEach(p => {
    if (!p || !p.tag) return;
    // 调用内置序列化，将节点对象变成小火箭单行标准明文
    let shadowrocketLine = SubStore.Script.Util.PROXY.stringify(p, "shadowrocket");
    if (shadowrocketLine) {
      proxyLines.push(shadowrocketLine);
      allNodeTags.push(p.tag);

      if (REGEX_HK.test(p.tag)) hkNodes.push(p.tag);
      else if (REGEX_SG.test(p.tag)) sgNodes.push(p.tag);
      else if (REGEX_JP.test(p.tag)) jpNodes.push(p.tag);
      else if (REGEX_KR.test(p.tag)) krNodes.push(p.tag);
      else if (REGEX_US.test(p.tag)) usNodes.push(p.tag);
      else otherNodes.push(p.tag);
    }
  });

  const cleanG = (nodes) => nodes.length > 0 ? nodes.join(", ") : "DIRECT";

  // 手搓组装小火箭标准的 .conf 文本内容
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

  // 同时支持两种底层的文本接管机制，确保绝不漏网
  if (typeof $content !== 'undefined') {
    $content = finalConf;
  }
  
  return finalConf;
}
