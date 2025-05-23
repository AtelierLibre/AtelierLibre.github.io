/* rand2
 * 
 * Generates a random number based on the input
 * 
 * n: The input to generate the random number from
 */
fn rand2(
	n: vec2f
) -> f32 {
	return fract( sin( dot( n, vec2f( 12.9898, 4.1414 ) ) ) * 43758.5453 );
}

/* blur
 * 
 * Blurs the image by averaging the color of the pixel and its neighbors
 * 
 * image: The image to blur
 * uv: The UV coordinates of the pixel
 */
fn blur(
	image : texture_storage_2d< rgba16float, read >,
	uv : vec2i
) -> vec4f {
	var color = vec4f( 0.0 );
	color += textureLoad( image, uv + vec2i( -1, 0 ));
	color += textureLoad( image, uv + vec2i( 1, 0 ));
	color += textureLoad( image, uv + vec2i( 0, 0 ));
	color += textureLoad( image, uv + vec2i( 0, -1 ));
	color += textureLoad( image, uv + vec2i( 0, 1 ));
	return color / 5.0; 
}

/* getUV
 * 
 * Returns the UV coordinates for a given pixel position
 * 
 * posX: The x position of the pixel
 * posY: The y position of the pixel
 * width: The width of the image
 * height: The height of the image
 */
fn getUV(
	posX: u32,
	posY: u32,
	width: u32,
	height: u32
) -> vec2f {
	let uv = vec2f(
		f32( posX ) / f32( width ),
		f32( posY ) / f32( height )
	);
	return uv;
}