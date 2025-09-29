'use client'

import React from 'react'
import styled from 'styled-components'

interface UIverseButtonProps {
  /** 按鈕內容 */
  children: React.ReactNode
  /** 點擊事件 */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 自定義類名 */
  className?: string
  /** 按鈕類型 */
  type?: 'button' | 'submit' | 'reset'
}

// 內部邊框元素 - 完全匹配 UIverse 原始設計
const Border = styled.div`
  position: absolute;
  border: 0.15em solid #4caf50; /* 綠色邊框 - 製茶所品牌色*/
  transition: all 0.3s 0.08s linear;
  top: 50%;
  left: 50%;
  width: calc(100% - 0.5em); /* 相對於按鈕寬度 */
  height: calc(100% - 0.5em); /* 相對於按鈕高度 */
  transform: translate(-50%, -50%);
  pointer-events: none;
  border-radius: 2em; /* UIverse 原始圓角設計 */
`

// 按鈕文字
const ButtonText = styled.span`
  color: #1b5e20; /* 深綠色文字 - 製茶所品牌色 */
  position: relative;
  z-index: 2;
`

// 主按鈕樣式 - 完全匹配 UIverse 原始設計
const StyledButton = styled.button<{ $disabled?: boolean }>`
  /* 完全匹配 UIverse 原始樣式 */
  font-size: 16px;
  position: relative;
  margin: auto;
  padding: 1em 2.5em 1em 2.5em;
  border: none;
  background: #f1f8e9; /* 淺綠色背景 - 製茶所品牌色 */
  transition: all 0.1s linear;
  box-shadow: 0 0.4em 1em rgba(0, 0, 0, 0.1); /* 黑色陰影 - UIverse 原始 */

  /* 確保按鈕佔滿容器寬度 */
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* 約束內部元素 */

  /* UIverse 原始圓角設計 */
  border-radius: 2em;

  /* 基礎互動樣式 */
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.$disabled ? 0.6 : 1)};

  /* 點擊效果 - UIverse 原始縮放動畫 */
  &:active {
    transform: ${props => (props.$disabled ? 'none' : 'scale(0.95)')};
  }

  /* 懸停時邊框擴展效果 - UIverse 原始尺寸 */
  &:hover ${Border} {
    width: ${props => (props.$disabled ? 'calc(100% - 0.5em)' : 'calc(100% - 0.2em)')};
    height: ${props => (props.$disabled ? 'calc(100% - 0.5em)' : 'calc(100% - 0.2em)')};
  }

  /* 禁用狀態 */
  ${props =>
    props.$disabled &&
    `
    background: #e8f5e8;
    box-shadow: 0 0.2em 0.5em rgba(0, 0, 0, 0.05);

    ${ButtonText} {
      color: #81c784;
    }

    ${Border} {
      border-color: #a5d6a7;
    }
  `}
`

/**
 * UIverse felipesntr/dangerous-deer-2 按鈕 - 完全原始版本
 *
 * 特色：
 * - 淺綠色背景和綠色邊框（製茶所品牌色）
 * - 動態擴展的內部邊框（9em×3em 到 9.9em×3.7em）
 * - 點擊時的縮放效果
 * - 黑色陰影系統
 * - 圓角設計 (border-radius: 2em)
 */
export const UIverseButton: React.FC<UIverseButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  type = 'button',
  ...props
}) => {
  return (
    <StyledButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      $disabled={disabled}
      className={className}
      {...props}
    >
      <ButtonText>{children}</ButtonText>
      <Border />
    </StyledButton>
  )
}
