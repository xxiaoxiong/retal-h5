const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置信息
const buildDir = path.resolve(__dirname, './dist/build/h5');

// 确保dist/build/h5目录存在
if (!fs.existsSync(buildDir)) {
    console.error('构建目录不存在，请先运行 npm run build:h5');
    process.exit(1);
}

try {
    console.log('准备部署到Netlify...');
    console.log('1. 确保已安装Netlify CLI: npm install -g netlify-cli');
    console.log('2. 切换到构建目录');
    process.chdir(buildDir);

    console.log('3. 执行部署命令');
    console.log('注意: 这将打开浏览器进行登录授权，如果您尚未登录Netlify');
    console.log('即将执行: netlify deploy --prod');

    // 在Windows系统上，我们需要使用PowerShell命令
    const isWin = process.platform === 'win32';
    if (isWin) {
        console.log('\n请手动执行以下命令:');
        console.log(`cd "${buildDir}"`);
        console.log('netlify deploy --prod');
    } else {
        execSync('netlify deploy --prod', { stdio: 'inherit' });
    }

    console.log('\n部署完成！您的网站现在应该已经上线了。');
} catch (error) {
    console.error('部署过程中出错:', error);
} 