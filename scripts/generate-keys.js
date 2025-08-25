#!/usr/bin/env node

/**
 * 安全密鑰生成工具
 * 
 * 為 Vercel 部署生成所需的安全密鑰
 * 包括 JWT_SECRET 和 ADMIN_API_KEY
 */

const crypto = require('crypto');

console.log('🔐 安全密鑰生成工具');
console.log('==========================================');
console.log('');

/**
 * 生成安全的隨機密鑰
 */
function generateSecureKey(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64');
}

/**
 * 驗證密鑰強度
 */
function validateKeyStrength(key) {
  const checks = {
    length: key.length >= 32,
    hasUppercase: /[A-Z]/.test(key),
    hasLowercase: /[a-z]/.test(key),
    hasNumbers: /\d/.test(key),
    hasSpecial: /[+/=]/.test(key) // base64 特殊字符
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}

// 生成 JWT_SECRET
const jwtSecret = generateSecureKey(32);
const jwtValidation = validateKeyStrength(jwtSecret);

console.log('📝 JWT_SECRET (用於 JSON Web Token 簽名)');
console.log(`密鑰: ${jwtSecret}`);
console.log(`長度: ${jwtSecret.length} 字元`);
console.log(`安全評分: ${jwtValidation.score}/5 ⭐`);
console.log('');

// 生成 ADMIN_API_KEY
const adminApiKey = generateSecureKey(32);
const adminValidation = validateKeyStrength(adminApiKey);

console.log('🔑 ADMIN_API_KEY (用於管理員 API 認證)');
console.log(`密鑰: ${adminApiKey}`);
console.log(`長度: ${adminApiKey.length} 字元`);
console.log(`安全評分: ${adminValidation.score}/5 ⭐`);
console.log('');

console.log('📋 Vercel 環境變數設定');
console.log('==========================================');
console.log('將以下內容複製到 Vercel Dashboard → Settings → Environment Variables:');
console.log('');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ADMIN_API_KEY=${adminApiKey}`);
console.log('');

console.log('📄 本地開發 .env.local 設定');
console.log('==========================================');
console.log('將以下內容加入您的 .env.local 檔案:');
console.log('');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ADMIN_API_KEY=${adminApiKey}`);
console.log('');

console.log('⚠️  安全提醒');
console.log('==========================================');
console.log('• 請妥善保管這些密鑰，不要分享給他人');
console.log('• 不要將密鑰提交到 Git 儲存庫中');
console.log('• 生產環境和開發環境應使用不同的密鑰');
console.log('• 建議每 3-6 個月輪換一次密鑰');
console.log('');

console.log('🚀 下一步');
console.log('==========================================');
console.log('1. 複製上方密鑰到 Vercel Dashboard');
console.log('2. 設定其他必要環境變數（Supabase）');
console.log('3. 重新部署您的 Vercel 應用');
console.log('4. 測試安全功能是否正常運作');
console.log('');
console.log('詳細指南請參考: docs/VERCEL_DEPLOYMENT.md');

// 如果是在命令行直接執行，也提供簡化版本
if (process.argv.includes('--simple')) {
  console.log('\n🎯 簡化輸出 (適合腳本使用)');
  console.log('==========================================');
  console.log(jwtSecret);
  console.log(adminApiKey);
}