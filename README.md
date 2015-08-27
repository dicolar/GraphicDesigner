GraphicDesigner
===============
a graphic designer developed by extjs4/jquery/raphael.high customizable view bevaviors(delegates)

Hi,everyone.im a web/java/ios developer from China.
recently im developing a Graphic Designer based on ExtJs4.2.x&jQuery&raphael.i think it's a very common thing and 
there're lots of familiar designers throughout the web.
But,u really should look at this,it's very friendly with ur BUSINESS!
    
	> want to draw a workflow template?
	NO PROBLEM!
	> want to build up a form designer?
	NO PROBLEM!
	> when users commit their diagrams but you donot accept that is invalid?(i.e. validate diagram)?
	NO PROBLEM!
  
Graphic Designer has a well-designed mechanism of 'DELEGATE(like plugin)',
when u want 2 add new behaviors 2 a view(i.e. circle/rect/text/path and so on),just write a customized delegate 4 it,and wire it with the view which u want 2 do this!
  
it's a world of delegates!

let's take a look at some screenshots & features!

base
---------
![image](https://raw.githubusercontent.com/dicolar/GraphicDesigner/master/base.png)

form design->form render
---------
![image](https://raw.githubusercontent.com/dicolar/GraphicDesigner/master/form-translation.png)

toolbox
---------
![image](https://raw.githubusercontent.com/dicolar/GraphicDesigner/master/toolbox.png)

preview
---------
![image](https://raw.githubusercontent.com/dicolar/GraphicDesigner/master/preview.png)

autodock
---------
![image](https://raw.githubusercontent.com/dicolar/GraphicDesigner/master/autodock.png)

dragdrop
---------
![image](https://raw.githubusercontent.com/dicolar/GraphicDesigner/master/drag-drop.png)

but,there're still some known issues on it,and it's now at version 0.0.1-beta.
you can watch this project, any suggestion is appreciated!

### known issue:
> 1. when 2 views get closer and they have at least 1 line linked,the line may disappear
  this is caused by the a* algrithm,im now workin on it!
>
> 2. when cut/copy any views that have any linkers,linkers will disappear
>
> 3. multi selection is not supported right now
