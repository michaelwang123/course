# E2E Test Fixtures

Place the following test fixture files in this directory before running E2E tests:

- `test-photo.jpg` - A standard JPEG photo (any portrait photo, ideally with a solid color background)
- `test-file.txt` - A plain text file (for testing unsupported format handling)
- `large-file.jpg` - A JPEG file larger than 10MB (for testing file size limits)
- `complex-background.jpg` - A photo with a complex/multi-color background (for testing background detection warnings)

## Creating Test Fixtures

You can create minimal test fixtures for CI:

```bash
# Create a simple text file
echo "not an image" > test-file.txt

# Use ImageMagick or any tool to create test images:
# convert -size 400x600 xc:white -fill blue -draw "circle 200,200 200,300" test-photo.jpg
# convert -size 400x600 plasma: complex-background.jpg
```
