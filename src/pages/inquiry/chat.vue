<template>
  <view class="inquiry-chat-page">
    <scroll-view
      scroll-y
      class="message-list"
      :scroll-into-view="scrollToView"
      scroll-with-animation
    >
      <!-- 提示信息 -->
      <view class="tips" v-if="propertyInfo">
        正在咨询关于 "{{ propertyInfo.title }}" 的信息
      </view>
      <view class="tips" v-else> 您可以咨询关于房源的任何问题 </view>

      <!-- 消息列表 -->
      <view
        v-for="(message, index) in messages"
        :key="index"
        :id="`msg-${index}`"
      >
        <view
          :class="[
            'message-item',
            message.sender === 'user' ? 'user-message' : 'ai-message',
          ]"
        >
          <image
            class="avatar"
            :src="
              message.sender === 'user'
                ? '/static/user-avatar.png'
                : '/static/ai-avatar.png'
            "
          ></image>
          <view class="message-content">
            <text selectable>{{ message.text }}</text>
            <!-- 可以在这里添加推荐房源的卡片 -->
          </view>
        </view>
      </view>

      <!-- 加载中提示 -->
      <view
        v-if="isAiResponding"
        class="message-item ai-message loading-message"
      >
        <image class="avatar" src="/static/ai-avatar.png"></image>
        <view class="message-content">
          <text>思考中...</text>
        </view>
      </view>

      <!-- 滚动占位 -->
      <view id="bottom-anchor"></view>
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-area">
      <input
        class="input-field"
        v-model="userInput"
        placeholder="请输入您的问题..."
        confirm-type="send"
        @confirm="sendMessage"
        :disabled="isAiResponding"
      />
      <button
        class="send-button"
        @click="sendMessage"
        :disabled="!userInput.trim() || isAiResponding"
      >
        发送
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import type { Property } from "@/types/models"; // 假设类型定义

interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: number;
}

const messages = ref<Message[]>([]);
const userInput = ref("");
const isAiResponding = ref(false);
const scrollToView = ref("");
const propertyId = ref<string | null>(null);
const propertyInfo = ref<Partial<Property> | null>(null); // 用于显示咨询的房源信息

// 模拟获取房源简要信息 (可选)
const fetchPropertyInfo = async (id: string) => {
  console.log(`Fetching brief info for property ID: ${id}`);
  // --- 模拟API请求 ---
  await new Promise((resolve) => setTimeout(resolve, 300));
  propertyInfo.value = {
    id: id,
    title: `模拟房源 ${id.split("_")[1]}`,
  };
  // --- 模拟结束 ---
  // 实际开发中可从详情页传递或重新请求
};

// 滚动到底部
const scrollBottom = () => {
  nextTick(() => {
    scrollToView.value = ""; // 清空之前的锚点
    setTimeout(() => {
      // 延迟确保DOM更新
      scrollToView.value = "bottom-anchor";
    }, 100);
  });
};

// 发送消息
const sendMessage = async () => {
  const text = userInput.value.trim();
  if (!text || isAiResponding.value) {
    return;
  }

  // 1. 添加用户消息
  messages.value.push({ sender: "user", text, timestamp: Date.now() });
  userInput.value = "";
  scrollBottom();

  // 2. 显示AI思考中
  isAiResponding.value = true;

  // 3. 准备对话历史 (可选)
  const conversationHistory = messages.value.slice(-5); // 取最近几条作为历史

  // 4. 调用后端AI接口 (模拟)
  console.log("Sending to AI:", {
    question: text,
    propertyId: propertyId.value,
    history: conversationHistory,
  });
  // --- 模拟API请求 ---
  await new Promise((resolve) => setTimeout(resolve, 1500)); // 模拟AI响应时间
  const aiResponseText = `关于"${text}"，我的回答是：这是模拟的AI回复。如果您咨询的是房源 ${
    propertyInfo.value?.title || ""
  }, 它的特点是...`;
  // --- 模拟结束 ---

  // 实际开发中替换为调用API的代码
  // try {
  //   const response = await uni.request({
  //     url: '/api/ai/chat',
  //     method: 'POST',
  //     data: {
  //       question: text,
  //       property_id: propertyId.value,
  //       conversation_history: conversationHistory
  //     }
  //   });
  //   if (response.statusCode === 200 && response.data) {
  //     aiResponseText = response.data.answer;
  //     // 处理推荐房源: response.data.recommended_properties
  //   } else {
  //     aiResponseText = '抱歉，我暂时无法回答您的问题。';
  //     console.error('AI response error:', response);
  //   }
  // } catch (error) {
  //   aiResponseText = '网络错误，请稍后再试。';
  //   console.error('AI request error:', error);
  // }

  // 5. 添加AI回复
  messages.value.push({
    sender: "ai",
    text: aiResponseText,
    timestamp: Date.now(),
  });
  isAiResponding.value = false;
  scrollBottom();
};

// 页面加载时获取参数
onLoad((options) => {
  if (options?.propertyId) {
    propertyId.value = options.propertyId;
    fetchPropertyInfo(options.propertyId); // 获取房源信息用于提示
    // 添加初始欢迎语
    messages.value.push({
      sender: "ai",
      text: `您好！很高兴为您服务。您可以问我关于房源 ${
        propertyInfo.value?.title || ""
      } 的任何问题。`,
      timestamp: Date.now(),
    });
  } else {
    messages.value.push({
      sender: "ai",
      text: "您好！很高兴为您服务。您可以问我关于房源的任何问题。",
      timestamp: Date.now(),
    });
  }
  scrollBottom();
});
</script>

<style lang="scss" scoped>
.inquiry-chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f4f4;
}

.message-list {
  flex-grow: 1;
  padding: 10px 10px 0; // 顶部和左右留白
  overflow-y: auto;
  box-sizing: border-box;
}

.tips {
  font-size: 12px;
  color: #999;
  text-align: center;
  padding: 10px 0;
}

.message-item {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 5px;
    flex-shrink: 0;
  }

  .message-content {
    background-color: #fff;
    padding: 10px 12px;
    border-radius: 8px;
    margin: 0 10px;
    max-width: calc(100% - 120px); // 限制最大宽度
    font-size: 15px;
    line-height: 1.5;
    word-wrap: break-word;
    position: relative;

    // 小三角
    &::before {
      content: "";
      position: absolute;
      top: 12px;
      border: 6px solid transparent;
    }
  }
}

.user-message {
  flex-direction: row-reverse; // 用户消息反向排列

  .message-content {
    background-color: #95ec69; // 用户消息气泡颜色
    color: #000;
    &::before {
      right: -12px;
      border-left-color: #95ec69;
    }
  }
}

.ai-message {
  .message-content {
    background-color: #ffffff;
    color: #333;
    &::before {
      left: -12px;
      border-right-color: #ffffff;
    }
  }
}

.loading-message {
  .message-content {
    color: #999;
  }
}

#bottom-anchor {
  height: 1px; // 必须有高度才能被滚动到
}

.input-area {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f8f8f8;
  border-top: 1px solid #eee;

  .input-field {
    flex-grow: 1;
    height: 38px;
    line-height: 38px;
    padding: 0 10px;
    background-color: #fff;
    border-radius: 5px;
    font-size: 15px;
    margin-right: 10px;
  }

  .send-button {
    width: 65px;
    height: 38px;
    line-height: 38px;
    font-size: 15px;
    padding: 0;
    background-color: #409eff;
    color: #fff;
    border-radius: 5px;
    flex-shrink: 0;

    &[disabled] {
      background-color: #a0cfff;
      color: #e4e7ed;
    }
  }
}

// 可以在这里添加推荐房源卡片的样式
</style>

