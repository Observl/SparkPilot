// Run with the bundled Playwright module via PLAYWRIGHT_MODULE, or an installed playwright.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5180');await page.screenshot({path:'test-results/overview.png',fullPage:true});
 await page.getByRole('button',{name:'＋ 新建项目',exact:true}).click();await page.locator('dialog input[name=name]').fill('测试项目');await page.locator('dialog').getByRole('button',{name:'保存',exact:true}).click();
 await page.locator('[name=customer]').fill('小型软件团队');await page.locator('[name=product]').fill('知识整理服务');await page.locator('[name=value]').fill('减少重复答疑');await page.getByRole('button',{name:'保存企业档案'}).click();
 await page.getByRole('link',{name:'冷启动诊断'}).click();for(const name of ['customer','problem','value','channel','payment'])await page.locator(`input[name=${name}][value="2"]`).check();await page.getByRole('button',{name:'保存诊断'}).click();
 await page.getByRole('link',{name:'启动策略'}).click();await page.locator('[data-strategy=pilot]').click();await page.locator('dialog').getByRole('button',{name:'保存',exact:true}).click();
 await page.locator('[data-edit]').click();await page.locator('dialog [name=status]').selectOption('completed');await page.locator('dialog [name=actual]').fill('2');await page.locator('dialog [name=learning]').fill('客户愿意为交付付费');await page.locator('dialog [name=next]').fill('再测试五位客户');await page.locator('dialog').getByRole('button',{name:'保存',exact:true}).click();
 await page.getByRole('link',{name:'结果复盘'}).click();await page.getByText('达到目标 · 建议小规模重复验证',{exact:true}).waitFor();await page.reload();await page.getByText('客户愿意为交付付费',{exact:false}).waitFor();
 await page.getByRole('link',{name:'证据库'}).click();await page.getByRole('button',{name:'＋ 添加证据'}).click();await page.locator('dialog [name=title]').fill('真实访谈');await page.locator('dialog [name=source]').fill('客户一');await page.locator('dialog [name=note]').fill('<script>alert(1)</script>');await page.locator('dialog').getByRole('button',{name:'保存',exact:true}).click();await page.getByText('<script>alert(1)</script>',{exact:true}).waitFor();
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'导出备份'}).click()]);await download.saveAs('test-results/backup.json');
 await page.setViewportSize({width:390,height:844});for(const route of ['overview','profile','diagnosis','strategy','experiments','evidence','review']){await page.goto((process.env.TEST_URL||'http://127.0.0.1:5180')+'/#'+route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile overflow '+route);}
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5180')+'/#overview');await page.screenshot({path:'test-results/mobile.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS: 项目建档、诊断、策略、实验、复盘、刷新保留、证据转义、备份导出及七页手机布局');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
