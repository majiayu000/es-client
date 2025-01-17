#!/usr/bin/env python3
from PIL import Image
import os
import sys


def is_white_or_transparent(pixel):
    """检查像素是否是白色或透明"""
    r, g, b, a = pixel
    return a == 0 or (r > 250 and g > 250 and b > 250)  # 允许接近白色的像素


def check_padding(image_path):
    """检查图片是否有留白（白色或透明），返回四个边的留白像素数"""
    img = Image.open(image_path)

    # 转换为RGBA模式
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    # 获取图片数据
    width, height = img.size
    pixels = img.load()

    # 检查四个边的留白
    top = bottom = left = right = 0

    # 检查顶部留白
    for y in range(height):
        has_content = False
        for x in range(width):
            if not is_white_or_transparent(pixels[x, y]):
                has_content = True
                break
        if has_content:
            top = y
            break

    # 检查底部留白
    for y in range(height - 1, -1, -1):
        has_content = False
        for x in range(width):
            if not is_white_or_transparent(pixels[x, y]):
                has_content = True
                break
        if has_content:
            bottom = height - y - 1
            break

    # 检查左侧留白
    for x in range(width):
        has_content = False
        for y in range(height):
            if not is_white_or_transparent(pixels[x, y]):
                has_content = True
                break
        if has_content:
            left = x
            break

    # 检查右侧留白
    for x in range(width - 1, -1, -1):
        has_content = False
        for y in range(height):
            if not is_white_or_transparent(pixels[x, y]):
                has_content = True
                break
        if has_content:
            right = width - x - 1
            break

    # 检查四个角落的具体颜色值
    corners = [
        (0, 0, "左上"),
        (width - 1, 0, "右上"),
        (0, height - 1, "左下"),
        (width - 1, height - 1, "右下"),
    ]
    corner_colors = {name: pixels[x, y] for x, y, name in corners}
    has_white_corners = all(
        is_white_or_transparent(color) for color in corner_colors.values()
    )

    return {
        "file": os.path.basename(image_path),
        "size": f"{width}x{height}",
        "padding": {"top": top, "bottom": bottom, "left": left, "right": right},
        "has_white_corners": has_white_corners,
        "corner_colors": corner_colors,
    }


def main():
    # 检查当前目录下所有的png和ico文件
    image_files = [f for f in os.listdir(".") if f.endswith((".png", ".ico"))]

    print("\n图标留白检测报告:")
    print("-" * 50)

    for image_file in sorted(image_files):
        try:
            result = check_padding(image_file)
            padding = result["padding"]

            # 计算留白百分比
            total_padding = sum(padding.values())

            print(f"\n文件: {result['file']}")
            print(f"尺寸: {result['size']}")
            print(f"留白像素:")
            print(f"  上: {padding['top']} 下: {padding['bottom']}")
            print(f"  左: {padding['left']} 右: {padding['right']}")

            print("角落像素颜色值 (R,G,B,A):")
            for corner, color in result["corner_colors"].items():
                print(f"  {corner}: {color}")

            if result["has_white_corners"]:
                print("⚠️  检测到白色角落!")

            if total_padding > 0:
                print("⚠️  检测到留白!")
            else:
                print("✅ 无留白")

        except Exception as e:
            print(f"\n文件: {image_file}")
            print(f"❌ 错误: {str(e)}")

    print("\n" + "-" * 50)


if __name__ == "__main__":
    main()
