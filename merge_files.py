import os

# Define file paths
html_file = 'index.html'
css_file = 'style.css'
js_file = 'script.js'
output_file = 'BVScouter.html'

# Read the contents of the HTML file
with open(html_file, 'r') as file:
    html_content = file.read()

# Read the contents of the CSS file
with open(css_file, 'r') as file:
    css_content = file.read()

# Read the contents of the JS file
with open(js_file, 'r') as file:
    js_content = file.read()

# Insert CSS into the HTML file
html_content = html_content.replace('</head>', f'<style>{css_content}</style></head>')

# Remove the external script reference
html_content = html_content.replace('<script src="script.js"></script>', '')

# Insert JS into the HTML file
html_content = html_content.replace('</body>', f'<script>{js_content}</script></body>')

# Write the merged content to the output file
with open(output_file, 'w') as file:
    file.write(html_content)

print(f'Merged file created: {output_file}')
