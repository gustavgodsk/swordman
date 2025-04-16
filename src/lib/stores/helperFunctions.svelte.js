import * as SAT from "sat";

export const ctx2 = $state({
  context: null
})

// Function to draw a SAT.Vector
export function drawVector(ctx, v, color = '#000', radius = 3) {
  ctx = ctx2.context;

  if (ctx){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(v.x, v.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawLine(ctx, line, color = 'blue', width = 3) {
  ctx = ctx2.context;

  if (ctx){
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(line.p1.x, line.p1.y)
    ctx.lineTo(line.p2.x, line.p2.y)
    ctx.stroke();
    ctx.closePath();
  }
}

// Function to draw a SAT.Circle
export function drawCircle(ctx, circle, color = "blue") {
  ctx = ctx2.context;
  if (ctx){

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(circle.pos.x, circle.pos.y, circle.r, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw center point
    drawVector(ctx, circle. pos, '#000');
  }

}

// Function to draw a SAT.Polygon with rotation support
export function drawPolygon(ctx, polygon, color) {
  ctx = ctx2.context;
  if (ctx){

    ctx.fillStyle = color || "yellow";
    
  // Draw the polygon with rotation
  ctx.beginPath();
  const points = polygon.calcPoints;
  const firstPoint = new SAT.Vector(
    polygon.pos.x + points[0].x, 
    polygon.pos.y + points[0].y
  );
  
  ctx.moveTo(firstPoint.x, firstPoint.y);
  
  for (let i = 1; i < points.length; i++) {
    const point = new SAT.Vector(
      polygon.pos.x + points[i].x,
      polygon.pos.y + points[i].y
    );
    ctx.lineTo(point.x, point.y);
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Draw vertices
  for (let i = 0; i < points.length; i++) {
    const point = new SAT.Vector(
      polygon.pos.x + points[i].x,
      polygon.pos.y + points[i].y
    );
    drawVector(ctx, point, '#000', 2);
  }
  
  // Draw center point
  // drawVector(polygon.pos, '#000');
}

}

// Helper function to check and visualize collision between objects
export function checkCollision(obj1, obj2) {
  const response = new SAT.Response();
  let colliding = false;
  
  // Check collision based on object types
  if (obj1 instanceof SAT.Circle && obj2 instanceof SAT.Circle) {
    colliding = SAT.testCircleCircle(obj1, obj2, response);
  } else if (obj1 instanceof SAT.Circle && obj2 instanceof SAT.Polygon) {
    colliding = SAT.testCirclePolygon(obj1, obj2, response);
  } else if (obj1 instanceof SAT.Polygon && obj2 instanceof SAT.Circle) {
    colliding = SAT.testPolygonCircle(obj1, obj2, response);
  } else if (obj1 instanceof SAT.Polygon && obj2 instanceof SAT.Polygon) {
    colliding = SAT.testPolygonPolygon(obj1, obj2, response);
  }
  
  return colliding;
}

export function calculateDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}