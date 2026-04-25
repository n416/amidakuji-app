import re
from html.parser import HTMLParser

class JSXConverter(HTMLParser):
    def __init__(self):
        super().__init__()
        self.output = []
        self.in_script = False

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.in_script = True
            return
        if self.in_script:
            return

        attr_str = ""
        for key, value in attrs:
            if key == 'class':
                key = 'className'
            elif key == 'for':
                key = 'htmlFor'
            elif key == 'autocomplete':
                key = 'autoComplete'
            elif key == 'checked':
                key = 'defaultChecked'
            elif key == 'onsubmit' and value == 'return false;':
                key = 'onSubmit'
                value = '{(e) => e.preventDefault()}'
            elif '-' in key and not key.startswith('data-') and not key.startswith('aria-'):
                pass # Usually custom attributes, keep as is
            
            if key == 'style' and value:
                # Convert style="display: none; color: red;" to style={{ display: 'none', color: 'red' }}
                style_dict = {}
                parts = value.split(';')
                for p in parts:
                    if ':' in p:
                        k, v = p.split(':', 1)
                        k = k.strip()
                        v = v.strip().replace("'", "\\'")
                        # camelCase the key
                        if '-' in k:
                            k_parts = k.split('-')
                            k = k_parts[0] + ''.join(x.title() for x in k_parts[1:])
                        style_dict[k] = f"'{v}'"
                
                style_str = "{" + ", ".join(f"{k}: {v}" for k, v in style_dict.items()) + "}"
                attr_str += f" {key}={{{style_str}}}"
            else:
                if key == 'onSubmit' and value == '{(e) => e.preventDefault()}':
                    attr_str += f" {key}={value}"
                elif value is None:
                    attr_str += f" {key}"
                else:
                    attr_str += f' {key}="{value}"'
        
        if tag in ['input', 'img', 'br', 'hr', 'meta', 'link']:
            self.output.append(f"<{tag}{attr_str} />")
        else:
            self.output.append(f"<{tag}{attr_str}>")

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
            return
        if self.in_script:
            return
            
        if tag not in ['input', 'img', 'br', 'hr', 'meta', 'link']:
            self.output.append(f"</{tag}>")

    def handle_data(self, data):
        if not self.in_script:
            # Escape {} in text data
            data = data.replace('{', '&#123;').replace('}', '&#125;')
            self.output.append(data)
            
    def handle_charref(self, name):
        if not self.in_script:
            self.output.append(f"&#{name};")
            
    def handle_entityref(self, name):
        if not self.in_script:
            self.output.append(f"&{name};")

def convert_file():
    with open('public/index_old.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract body content
    match = re.search(r'<body[^>]*>(.*?)</body>', content, re.DOTALL | re.IGNORECASE)
    if not match:
        print("No body found")
        return
        
    body_content = match.group(1)
    
    converter = JSXConverter()
    converter.feed(body_content)
    
    jsx_content = "".join(converter.output)
    
    # Write App.tsx
    app_tsx = f"""import React, {{ useEffect }} from 'react';

const App: React.FC = () => {{
  useEffect(() => {{
    // ここでVanilla JSのエントリポイントを呼び出す（動的import等で）
    const loadLegacyScripts = async () => {{
      // @ts-ignore
      await import('./lib/main.js');
    }};
    loadLegacyScripts();
  }}, []);

  return (
    <>
      {jsx_content}
    </>
  );
}};

export default App;
"""
    
    with open('src/client/App.tsx', 'w', encoding='utf-8') as f:
        f.write(app_tsx)
    print("Converted App.tsx successfully.")

if __name__ == '__main__':
    convert_file()
