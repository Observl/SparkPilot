// Product review windows, not ISO-prescribed lifetimes or probabilities of truth.
export const categories = ['自动识别', '促销与价格', '突发事件与舆情', '竞品动态', '渠道规则', '政策与监管', '行业研究', '客户研究'];
export const sourceTypes = ['未核实来源', '官方原文', '企业一手记录', '署名媒体', '研究报告', '社交或转载'];
export const contextGroups = [
  ['启动背景与目标', [['businessStage','启动类型（新企业 / 新业务）'],['businessModel','业务类型（B2B / 电商 / SaaS / 平台）'],['region','目标地区'],['launchDate','启动期限','date'],['customerGoal','首批客户目标','number']]],
  ['客户与购买过程', [['userRole','实际使用者'],['payer','付费者'],['decisionMaker','购买决策者'],['frequency','需求发生频率'],['alternatives','现有替代方案'],['salesCycle','采购周期（天）','number']]],
  ['产品与交付', [['maturity','产品成熟度'],['timeToValue','首次获得价值所需时间'],['capacity','产能及计量单位'],['inventory','库存及计量单位'],['serviceRadius','服务范围'],['bottleneck','交付瓶颈']]],
  ['单位经济', [['currency','记账币种'],['price','单笔实收价格','number'],['variableCost','单笔变动成本','number'],['commission','单笔平台佣金','number'],['couponCost','单笔优惠成本','number'],['refundCost','单笔平均退款损失','number'],['paymentDays','回款周期（天）','number']]],
  ['资金与资源', [['cash','可用于启动的现金','number'],['monthlyBurn','每月净现金消耗','number'],['lossLimit','最大可承受实验亏损','number'],['teamTime','团队可投入时间'],['channels','已有渠道与资源']]],
  ['外部市场环境', [['competitors','主要竞品与定价活动'],['channelRules','相关渠道规则'],['seasonality','季节性与需求变化'],['policy','政策与舆情背景']]],
  ['证据口径与局限', [['contextSource','档案数据来源'],['contextDate','数据截至日期','date'],['sample','样本与获取方法'],['limitations','适用范围、矛盾与未知项']]]
];
export const metricNames=['访问','咨询','试用','激活','付款','退款','复购','留存'];
export function localDay(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;}
export function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function inferCategory(item){if(item.category&&item.category!=='自动识别')return item.category;const text=item.title+' '+item.note;if(/突发|舆情|危机|事故|召回|争议|宕机/.test(text))return '突发事件与舆情';if(/优惠|促销|折扣|价格|降价|补贴|限时|优惠券/.test(text))return '促销与价格';if(/政策|监管|法规|法律|条例/.test(text))return '政策与监管';if(/渠道|平台规则|佣金|流量规则/.test(text))return '渠道规则';if(/竞品|发布|上线|新品/.test(text))return '竞品动态';if(/访谈|客户|问卷/.test(text))return '客户研究';if(/行业|研究|报告|市场规模/.test(text))return '行业研究';return '未分类';}
const windows={'促销与价格':7,'突发事件与舆情':2,'竞品动态':30,'渠道规则':30,'政策与监管':30,'行业研究':180,'客户研究':90};
export function freshness(item,today=localDay()){
  const category=inferCategory(item),days=windows[category]||7;
  const match=(item.title+' '+item.note).match(/(?:截止|截至|有效期至|结束于)[：:\s]*(\d{4})[年/\-](\d{1,2})[月/\-](\d{1,2})日?/);
  const extracted=match?`${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`:'';
  const deadline=item.validUntil||(validDate(extracted)?extracted:'');
  const deadlineReason=item.validUntil?'采用人工填写的截止日。':deadline?'从正文识别明确截止日，请核对原文及其适用对象。':'无明确截止日，按内容类别估算复核时间。';
  if(deadline&&deadline<today)return {category,days,label:'明确期限已结束',tone:'stale',until:deadline,reason:deadlineReason+'期限结束不代表历史事实失真。'};
  if(!validDate(item.publishedAt||''))return {category,days,label:'日期未知 · 待核查',tone:'unknown',until:deadline,reason:'缺少发布时间，不使用入库时间替代。'+deadlineReason};
  if(item.publishedAt>today)return {category,days,label:'未来信息 · 待生效',tone:'unknown',until:'',reason:'发布时间在未来，请检查来源日期或活动安排。'};
  const date=new Date(item.publishedAt+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+days);const reviewAt=date.toISOString().slice(0,10);
  const expired=deadline&&deadline<today;
  const until=deadline&&deadline<reviewAt?deadline:reviewAt;
  const remaining=Math.ceil((new Date(until+'T00:00:00Z')-new Date(today+'T00:00:00Z'))/86400000);
  const label=expired?'明确期限已结束':remaining<0?'已到复核期':remaining<=Math.max(1,Math.floor(days*.2))?'即将复核':'参考期内';
  return {category,days,until,label,tone:expired||remaining<0?'stale':remaining<=Math.max(1,Math.floor(days*.2))?'soon':'fresh',reason:`${category}默认 ${days} 天复核；${deadlineReason}到期只代表需要复核，不代表历史事实失真。`};
}
export function reliability(item){
  const reasons=[];let level='待核查',tone='unknown';
  if(item.conflict==='是')return {level:'存在冲突',tone:'stale',reasons:['存在相互矛盾的证据，需核对原始资料。']};
  if(item.verification==='已核对原文'&&item.source.trim()&&validDate(item.publishedAt||'')){
    level='中等依据';tone='soon';reasons.push('记录者声明已核对原文，系统未自动验证。');
    if(['官方原文','企业一手记录','研究报告'].includes(item.sourceType)&&item.corroboration>=1&&item.corroborationSources?.trim()){
      level='较强依据';tone='fresh';reasons.push('声明具有可追溯的一手资料，并记录独立佐证来源。');
    }else reasons.push('缺少一手来源或独立佐证，避免单一来源定论。');
  }else reasons.push('来源、日期或原文核对记录不足。');
  if(item.sourceType==='社交或转载'){level='待核查';tone='unknown';reasons.push('社交或转载信息应追溯原始出处。');}
  if(item.kind==='假设'||item.kind==='观点'){level='观点 / 假设';tone='unknown';reasons.push('此条记录不是已证实事实。');}
  return {level,tone,reasons};
}
export function validateMarket(item){
  for(const k of ['id','title','note','source','url','publishedAt','collectedAt','category','origin','sourceType','verification','validUntil','region','kind','conflict','corroborationSources'])if(typeof item[k]!=='string'||item[k].length>12000)throw Error('市场信息字段不完整：'+k);
  if(!item.id||!item.title.trim()||!item.note.trim()||!item.source.trim())throw Error('标题、正文和来源不能为空');
  for(const k of ['publishedAt','validUntil'])if(item[k]&&!validDate(item[k]))throw Error(k+' 日期无效');
  if(!validDate(item.collectedAt))throw Error('入库日期无效');
  if(item.validUntil&&item.publishedAt&&item.validUntil<item.publishedAt)throw Error('截止日期不能早于发布时间');
  if(item.url&&!safeUrl(item.url))throw Error('来源链接仅支持 http 或 https');
  if(!categories.includes(item.category)||!sourceTypes.includes(item.sourceType)||!['人工','AI'].includes(item.origin)||!['未核对','已核对原文'].includes(item.verification)||!['事实记录','观点','假设'].includes(item.kind)||!['是','否','未知'].includes(item.conflict)||!Number.isInteger(item.corroboration)||item.corroboration<0||item.corroboration>10000)throw Error('市场信息选项或佐证数量无效');
  return item;
}
export function normalizeMarket(data){return validateMarket({id:crypto.randomUUID(),title:'',note:'',source:'',url:'',publishedAt:'',collectedAt:localDay(),category:'自动识别',origin:'人工',sourceType:'未核实来源',verification:'未核对',validUntil:'',region:'',kind:'事实记录',conflict:'未知',corroboration:0,corroborationSources:'',...data,corroboration:Number(data.corroboration||0)});}
export function feedItems(state){return state.projects.flatMap(project=>[...(project.market||[]).map(e=>({...e,projectId:project.id,projectName:project.name})),...project.evidence.map(e=>({...normalizeMarket({title:e.title,note:e.note||'未填写正文',source:e.source||'未记录来源',publishedAt:validDate(e.date)?e.date:'',kind:e.type==='待验证假设'?'假设':'事实记录',category:e.type==='访谈记录'?'客户研究':'自动识别'}),id:'evidence:'+e.id,collectedAt:validDate(e.date)?e.date:localDay(),projectId:project.id,projectName:project.name,legacy:true}))]).sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||'')||b.collectedAt.localeCompare(a.collectedAt)||a.id.localeCompare(b.id));}
export function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}else if(c===','||c==='\n'||c==='\r'){row.push(cell);cell='';closed=false;if(c!==','){if(row.some(v=>v!==''))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}else if(c==='"'&&!cell&&!closed){quoted=true;}else{if(closed||c==='"')throw Error('CSV 引号格式无效');cell+=c;}}
  if(quoted)throw Error('CSV 引号未闭合');row.push(cell);if(row.some(v=>v!==''))rows.push(row);if(rows.length<2)throw Error('CSV 需要表头和至少一条记录');const headers=rows.shift().map(s=>s.trim());if(new Set(headers).size!==headers.length)throw Error('CSV 表头重复');if(rows.length>2000)throw Error('单次最多导入 2000 条');return rows.map((values,i)=>{if(values.length!==headers.length)throw Error(`第 ${i+2} 行列数与表头不符`);return Object.fromEntries(headers.map((h,j)=>[h,values[j].trim()]));});
}
export const marketHeaders=['title','note','source','url','publishedAt','validUntil','category','origin','sourceType','verification','region','kind','conflict','corroboration','corroborationSources'];
export const metricHeaders=['metric','value','denominator','periodStart','periodEnd','source','segment'];
export function csvEncode(rows){return '\uFEFF'+rows.map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\r\n');}
export function marketCSV(text){return parseCSV(text).map((row,i)=>{for(const name of Object.keys(row))if(!marketHeaders.includes(name))throw Error('未知市场信息列：'+name);try{return normalizeMarket(Object.fromEntries(Object.entries(row).filter(([,v])=>v!=='')));}catch(e){throw Error(`第 ${i+2} 行：${e.message}`);}});}
export function validateMetric(row){if(!metricNames.includes(row.metric)||!Number.isFinite(row.value)||row.value<0||!Number.isInteger(row.value))throw Error('指标须为预设类型，数值须为非负整数');if(row.denominator!==null&&(!Number.isInteger(row.denominator)||row.denominator<=0||row.value>row.denominator))throw Error('分母须为正整数且不少于分子');for(const k of ['id','source','segment','periodStart','periodEnd'])if(typeof row[k]!=='string')throw Error('指标字段不完整');if(!row.source.trim()||!validDate(row.periodStart)||!validDate(row.periodEnd)||row.periodStart>row.periodEnd)throw Error('指标需提供来源与有效统计周期');return row;}
export function normalizeMetric(row){return validateMetric({...row,id:row.id||crypto.randomUUID(),value:row.value===''?NaN:Number(row.value),denominator:row.denominator===''||row.denominator==null?null:Number(row.denominator),segment:row.segment||''});}
export function metricsCSV(text){return parseCSV(text).map((row,i)=>{for(const name of Object.keys(row))if(!metricHeaders.includes(name))throw Error('未知指标列：'+name);try{return normalizeMetric(row);}catch(e){throw Error(`第 ${i+2} 行：${e.message}`);}});}
export function assessContext(context={}){const messages=[];const number=key=>context[key]!==''&&context[key]!=null?Number(context[key]):null;const price=number('price'),costs=['variableCost','commission','couponCost','refundCost'].map(number);if(price!==null&&costs.every(v=>v!==null)){const margin=price-costs.reduce((s,v)=>s+v,0);messages.push(`按填写口径，单笔贡献额为 ${margin.toFixed(2)} ${context.currency||'（币种未填写）'}。${margin<=0?'贡献额非正，扩大获客可能放大亏损。':'尚未扣除获客与固定成本。'}价格与成本需为同一期间，优惠若已从实收扣除，不要重复填写。`);}else messages.push('单位经济数据不足：不推算贡献额或可接受获客成本。');const cash=number('cash'),burn=number('monthlyBurn');if(cash!==null&&burn!==null&&burn>0)messages.push(`按当前净消耗静态估计，现金可支撑约 ${(cash/burn).toFixed(1)} 个月；不包含未来收支变化。`);messages.push('缺失或无法判断的数据保持未知；参考数据质量与来源追溯原则检查完整性、日期、口径和出处。不存在适用于所有行业的统一“大企业达标线”。');return messages;}
export function validateExtensions(project){if(project.context!==undefined){if(!project.context||typeof project.context!=='object'||Array.isArray(project.context))throw Error('背景数据格式错误');const allowed=new Map(contextGroups.flatMap(([,fields])=>fields.map(([id,,type])=>[id,type])));for(const [k,v] of Object.entries(project.context)){if(!allowed.has(k)||typeof v!=='string'||v.length>5000)throw Error('背景字段错误');if(allowed.get(k)==='number'&&v!==''&&(!Number.isFinite(Number(v))||Number(v)<0))throw Error('背景数值错误');if(allowed.get(k)==='date'&&v&&!validDate(v))throw Error('背景日期错误');}}for(const name of ['market','metrics'])if(project[name]!==undefined){if(!Array.isArray(project[name])||project[name].length>10000)throw Error('扩展记录格式错误');const ids=new Set();for(const row of project[name]){(name==='market'?validateMarket:validateMetric)(row);if(ids.has(row.id))throw Error('记录 ID 重复');ids.add(row.id);}}}
