const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置信息
const buildDir = path.resolve(__dirname, './dist/build/h5');
const deployBranch = 'gh-pages';
const isWin = process.platform === 'win32';

// 确保dist/build/h5目录存在
if (!fs.existsSync(buildDir)) {
    console.error('构建目录不存在，请先运行 npm run build:h5');
    process.exit(1);
}

// 复制目录函数 (Windows兼容)
function copyDir(src, dest) {
    // 创建目标目录
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    // 读取源目录内容
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            // 如果是目录，递归复制
            copyDir(srcPath, destPath);
        } else {
            // 如果是文件，直接复制
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    // 创建临时目录
    const tempDir = path.resolve(__dirname, '.deploy_temp');
    if (fs.existsSync(tempDir)) {
        // 使用平台兼容的命令删除目录
        if (isWin) {
            execSync(`rmdir /s /q "${tempDir}"`);
        } else {
            execSync(`rm -rf ${tempDir}`);
        }
    }
    fs.mkdirSync(tempDir);

    // 初始化Git仓库
    process.chdir(tempDir);
    execSync('git init');
    execSync(`git checkout -b ${deployBranch}`);

    // 复制构建文件 (使用自定义函数而不是cp命令)
    console.log('复制构建文件...');
    copyDir(buildDir, tempDir);

    // 提交文件
    execSync('git add .');
    execSync('git commit -m "Deploy to GitHub Pages"');

    // 推送到GitHub
    console.log('准备推送到GitHub...');
    const repoUrl = execSync('git config --get remote.origin.url', { cwd: __dirname }).toString().trim();
    execSync(`git push -f ${repoUrl} ${deployBranch}`);

    // 清理临时目录
    process.chdir(__dirname);
    if (isWin) {
        execSync(`rmdir /s /q "${tempDir}"`);
    } else {
        execSync(`rm -rf ${tempDir}`);
    }

    console.log(`成功部署到 ${deployBranch} 分支!`);
} catch (error) {
    console.error('部署过程中出错:', error);
} 