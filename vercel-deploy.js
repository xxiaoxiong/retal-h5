const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 确保dist/build/h5目录存在
const buildDir = path.resolve(__dirname, './dist/build/h5');
if (!fs.existsSync(buildDir)) {
    console.error('构建目录不存在，请先运行 npm run build:h5');
    process.exit(1);
}

try {
    console.log('准备部署到Vercel...');
    console.log('1. 确保已安装Vercel CLI: npm install -g vercel');

    // 不进入构建目录，而是在项目根目录执行部署
    // 因为我们在vercel.json中已经指定了distDir为dist/build/h5

    console.log('2. 执行部署命令');
    console.log('注意: 这将打开浏览器进行登录授权，如果您尚未登录Vercel');
    console.log('即将执行: vercel --prod');

    // 在Windows系统上，我们需要使用PowerShell命令
    const isWin = process.platform === 'win32';
    if (isWin) {
        console.log('\n请手动执行以下命令:');
        console.log(`cd "${__dirname}"`);
        console.log('vercel --prod');
    } else {
        execSync('vercel --prod', { stdio: 'inherit' });
    }

    console.log('\n部署完成！您的网站现在应该已经上线了。');
    console.log('如果遇到404错误，请确保:');
    console.log('1. vercel.json 文件存在且配置正确');
    console.log('2. 已经成功构建了H5版本 (npm run build:h5)');
} catch (error) {
    console.error('部署过程中出错:', error);
} 