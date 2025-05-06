const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('开始Vercel构建流程...');

// 运行构建命令
console.log('执行uniapp H5构建...');
execSync('npm run build:h5', { stdio: 'inherit' });

// 检查构建目录是否存在
const buildDir = path.resolve(__dirname, './dist/build/h5');
if (!fs.existsSync(buildDir)) {
    console.error('构建目录不存在，构建可能失败');
    process.exit(1);
}

// 检查index.html是否存在
const indexPath = path.join(buildDir, 'index.html');
if (!fs.existsSync(indexPath)) {
    console.error('index.html文件不存在，构建可能不完整');
    process.exit(1);
}

console.log('构建完成，输出目录:', buildDir);
console.log('构建目录内容:');
try {
    const files = fs.readdirSync(buildDir);
    console.log(files);
} catch (error) {
    console.error('读取构建目录失败:', error);
}

console.log('Vercel构建流程结束'); 