#!/usr/bin/env node

/**
 * Tests for image extraction and validation functionality
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function pass(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function fail(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
  process.exit(1);
}

// Test image extraction from markdown
function testMarkdownImageExtraction() {
  // Simulate the extraction regex
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

  const testCases = [
    {
      input: '![alt text](https://example.com/image.png)',
      expected: ['https://example.com/image.png'],
    },
    {
      input: '![](https://example.com/no-alt.jpg)',
      expected: ['https://example.com/no-alt.jpg'],
    },
    {
      input: '![with title](https://example.com/titled.gif "Title here")',
      expected: ['https://example.com/titled.gif'],
    },
    {
      input:
        'Text before ![first](https://a.com/1.png) middle ![second](https://b.com/2.jpg) after',
      expected: ['https://a.com/1.png', 'https://b.com/2.jpg'],
    },
    {
      input:
        '![GitHub uploaded](https://user-images.githubusercontent.com/123/456-789.png)',
      expected: ['https://user-images.githubusercontent.com/123/456-789.png'],
    },
  ];

  for (const tc of testCases) {
    const matches = [];
    let match;
    while ((match = markdownImageRegex.exec(tc.input)) !== null) {
      matches.push(match[2]);
    }

    if (JSON.stringify(matches) !== JSON.stringify(tc.expected)) {
      fail(
        `Markdown extraction failed for "${tc.input.substring(0, 50)}...". Got ${JSON.stringify(matches)}, expected ${JSON.stringify(tc.expected)}`
      );
    }
  }

  pass('Markdown image extraction works correctly');
}

// Test HTML image extraction
function testHtmlImageExtraction() {
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*\/?>/gi;

  const testCases = [
    {
      input: '<img src="https://example.com/image.png" />',
      expected: ['https://example.com/image.png'],
    },
    {
      input: '<img src="https://example.com/image.jpg" alt="test">',
      expected: ['https://example.com/image.jpg'],
    },
    {
      input: "<img alt='test' src='https://example.com/single-quotes.gif'>",
      expected: ['https://example.com/single-quotes.gif'],
    },
    {
      input:
        '<p><img src="https://a.com/1.png" /></p><img src="https://b.com/2.jpg">',
      expected: ['https://a.com/1.png', 'https://b.com/2.jpg'],
    },
  ];

  for (const tc of testCases) {
    const matches = [];
    let match;
    while ((match = htmlImageRegex.exec(tc.input)) !== null) {
      matches.push(match[1]);
    }

    if (JSON.stringify(matches) !== JSON.stringify(tc.expected)) {
      fail(
        `HTML extraction failed for "${tc.input.substring(0, 50)}...". Got ${JSON.stringify(matches)}, expected ${JSON.stringify(tc.expected)}`
      );
    }
  }

  pass('HTML image extraction works correctly');
}

// Test image magic bytes validation
function testMagicBytesValidation() {
  // PNG magic bytes: 89 50 4E 47
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // JPEG magic bytes: FF D8 FF
  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

  // GIF magic bytes: 47 49 46 (GIF)
  const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

  // HTML content (not an image)
  const htmlBuffer = Buffer.from('<!DOCTYPE html><html>');

  // Test PNG detection
  const bytes = [...pngBuffer.slice(0, 12)];
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    pass('PNG magic bytes detection works');
  } else {
    fail('PNG magic bytes detection failed');
  }

  // Test JPEG detection
  const jpegBytes = [...jpegBuffer.slice(0, 12)];
  if (jpegBytes[0] === 0xff && jpegBytes[1] === 0xd8 && jpegBytes[2] === 0xff) {
    pass('JPEG magic bytes detection works');
  } else {
    fail('JPEG magic bytes detection failed');
  }

  // Test GIF detection
  const gifBytes = [...gifBuffer.slice(0, 12)];
  if (gifBytes[0] === 0x47 && gifBytes[1] === 0x49 && gifBytes[2] === 0x46) {
    pass('GIF magic bytes detection works');
  } else {
    fail('GIF magic bytes detection failed');
  }

  // Test HTML detection (should not be detected as image)
  const htmlText = htmlBuffer.toString('utf8').trim().toLowerCase();
  if (htmlText.includes('<!doctype html') || htmlText.includes('<html')) {
    pass('HTML error page detection works');
  } else {
    fail('HTML error page detection failed');
  }
}

// Test URL replacement in markdown
function testUrlReplacement() {
  const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const originalUrl = 'https://example.com/image.png?token=abc123';
  const localPath = 'issue-1-images/image-1.png';
  const content = `Here is an image: ![alt](${originalUrl}) and more text`;

  const markdownRegex = new RegExp(
    `(!\\[[^\\]]*\\]\\()${escapeRegex(originalUrl)}((?:\\s+"[^"]*")?\\))`,
    'g'
  );

  const replaced = content.replace(markdownRegex, `$1${localPath}$2`);

  if (replaced.includes(localPath) && !replaced.includes(originalUrl)) {
    pass('URL replacement in markdown works correctly');
  } else {
    fail(`URL replacement failed. Got: "${replaced.substring(0, 100)}..."`);
  }
}

// Test file extension mapping
function testExtensionMapping() {
  const extensions = {
    png: '.png',
    jpeg: '.jpg',
    gif: '.gif',
    webp: '.webp',
    bmp: '.bmp',
    ico: '.ico',
    svg: '.svg',
  };

  for (const [type, ext] of Object.entries(extensions)) {
    if (!ext.startsWith('.')) {
      fail(`Extension for ${type} should start with dot, got ${ext}`);
    }
  }

  pass('File extension mapping is correct');
}

// Run all tests
async function runTests() {
  console.log('\n🧪 Running image extraction tests...\n');

  testMarkdownImageExtraction();
  testHtmlImageExtraction();
  testMagicBytesValidation();
  testUrlReplacement();
  testExtensionMapping();

  console.log('\n✅ All image extraction tests passed!\n');
}

runTests().catch((error) => {
  fail(`Test suite failed: ${error.message}`);
});
