import React, { useState, useRef } from 'react';
import {
    MantineProvider,
    Container,
    Title,
    Button,
    Group,
    Tooltip,
    Card,
    CopyButton
} from '@mantine/core';

const COLOR_MAPPINGS = {
    foreground: [
        { code: 31, name: 'Red', color: '#dc322f', ansiCode: 31 },
        { code: 32, name: 'Green', color: '#859900', ansiCode: 32 },
        { code: 33, name: 'Gold', color: '#b58900', ansiCode: 33 },
        { code: 34, name: 'Blue', color: '#268bd2', ansiCode: 34 },
        { code: 35, name: 'Pink', color: '#d33682', ansiCode: 35 },
        { code: 36, name: 'Teal', color: '#2aa198', ansiCode: 36 },
        { code: 37, name: 'White', color: '#ffffff', ansiCode: 37 }
    ],
    background: [
        { code: 40, name: 'Dark', color: '#002b36', ansiCode: 40 },
        { code: 41, name: 'Red', color: '#cb4b16', ansiCode: 41 },
        { code: 42, name: 'Gray', color: '#586e75', ansiCode: 42 },
        { code: 43, name: 'Light Gray', color: '#657b83', ansiCode: 43 },
        { code: 44, name: 'Blue Gray', color: '#839496', ansiCode: 44 },
        { code: 45, name: 'Blurple', color: '#6c71c4', ansiCode: 45 }
    ],
    styles: [
        { code: 1, name: 'Bold', ansiCode: 1 },
        { code: 4, name: 'Underline', ansiCode: 4 }
    ]
};

const DiscordTextGenerator = () => {
    const contentEditableRef = useRef(null);

    const getSelectedRange = () => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;
        return selection.getRangeAt(0);
    };

    const applyFormatting = (type, code) => {
        const range = getSelectedRange();
        if (!range || !contentEditableRef.current) return;

        const selectedText = range.toString();
        if (!selectedText) return;

        const ansiData = COLOR_MAPPINGS[type]?.find(item => item.code === code) || COLOR_MAPPINGS.styles.find(item => item.code === code);
        if (!ansiData) return;

        const prefix = `\u001b[${ansiData.ansiCode}m`;
        const suffix = `\u001b[0m`;
        const formattedText = prefix + selectedText + suffix;

        const span = document.createElement('span');
        span.textContent = selectedText;
        span.dataset.ansi = formattedText;

        let style = {};
        const existingStyles = span.dataset.styles ? JSON.parse(span.dataset.styles) : {};

        if (type === 'foreground') {
            style.color = COLOR_MAPPINGS.foreground.find(item => item.code === code)?.color;
            existingStyles.foreground = code;
        } else if (type === 'background') {
            style.backgroundColor = COLOR_MAPPINGS.background.find(item => item.code === code)?.color;
            existingStyles.background = code;
        } else if (type === 'styles') {
            if (ansiData.name === 'Bold') {
                style.fontWeight = 'bold';
                existingStyles.bold = true;
            } else if (ansiData.name === 'Underline') {
                style.textDecoration = 'underline';
                existingStyles.underline = true;
            }
        }

        Object.assign(span.style, style);
        span.dataset.styles = JSON.stringify(existingStyles);

        range.deleteContents();
        range.insertNode(span);

        // Try to maintain selection (more robust)
        const newRange = document.createRange();
        newRange.setStartAfter(span);
        newRange.setEndAfter(span);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(newRange);
    };

    const generateANSIText = () => {
        if (!contentEditableRef.current) return '';
        let ansiString = '';
        const nodes = contentEditableRef.current.childNodes;

        nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                ansiString += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN' && node.dataset.ansi) {
                ansiString += node.dataset.ansi;
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN' && !node.dataset.ansi) {
                ansiString += node.textContent; // Fallback
            }
        });
        return ansiString;
    };

    const copyToClipboard = () => {
        const formattedOutput = "```ansi\n" + generateANSIText() + "\n```";
        navigator.clipboard.writeText(formattedOutput);
    };

    const resetFormatting = () => {
        if (contentEditableRef.current) {
            const element = contentEditableRef.current;
            const spans = element.querySelectorAll('span[data-ansi], span[data-styles][style]');
            spans.forEach(span => {
                const textNode = document.createTextNode(span.textContent);
                span.parentNode.replaceChild(textNode, span);
            });
            element.normalize();
        }
    };

    return (
        <MantineProvider>
            <Container size="sm" className="p-4">
                <Title order={2} className="mb-4">
                    Discord <span style={{ color: '#5865F2' }}>Colored</span> Text Generator
                </Title>

                <Card shadow="sm" padding="lg" radius="md" withBorder className="mb-4">
                    <div
                        ref={contentEditableRef}
                        contentEditable={true}
                        style={{
                            border: '1px solid #ccc',
                            minHeight: '150px',
                            padding: '10px',
                            fontFamily: 'monospace',
                            backgroundColor: '#2F3136',
                            color: '#B9BBBE',
                            whiteSpace: 'pre-wrap'
                        }}
                    />
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder className="mb-4">
                    <Title order={4} mb="md">Styles</Title>
                    <Group>
                        {COLOR_MAPPINGS.styles.map((style) => (
                            <Button
                                key={style.code}
                                variant="outline"
                                onClick={() => applyFormatting('styles', style.code)}
                            >
                                {style.name}
                            </Button>
                        ))}
                    </Group>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder className="mb-4">
                    <Title order={4} mb="md">Foreground Colors</Title>
                    <Group>
                        {COLOR_MAPPINGS.foreground.map((color) => (
                            <Tooltip key={color.code} label={color.name}>
                                <Button
                                    variant="filled"
                                    color="gray"
                                    style={{
                                        backgroundColor: color.color,
                                        width: '30px',
                                        height: '30px',
                                        padding: 0
                                    }}
                                    onClick={() => applyFormatting('foreground', color.code)}
                                />
                            </Tooltip>
                        ))}
                    </Group>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Title order={4} mb="md">Background Colors</Title>
                    <Group>
                        {COLOR_MAPPINGS.background.map((color) => (
                            <Tooltip key={color.code} label={color.name}>
                                <Button
                                    variant="filled"
                                    color="gray"
                                    style={{
                                        backgroundColor: color.color,
                                        width: '30px',
                                        height: '30px',
                                        padding: 0
                                    }}
                                    onClick={() => applyFormatting('background', color.code)}
                                />
                            </Tooltip>
                        ))}
                    </Group>
                </Card>

                <Group mt="md">
                    <Button
                        fullWidth
                        onClick={copyToClipboard}
                    >
                        Copy Discord Formatted Text
                    </Button>
                    <Button
                        variant="outline"
                        color="red"
                        onClick={resetFormatting}
                    >
                        Reset Formatting
                    </Button>
                </Group>
            </Container>
        </MantineProvider>
    );
};

export default DiscordTextGenerator;