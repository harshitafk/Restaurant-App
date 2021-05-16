import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import {FormBuilder , FormGroup , Validators} from '@angular/forms';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { Comment } from '../shared/comment';
import { visibility,flyInOut,expand } from '../animations/app.animation';


@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [visibility(),flyInOut(),expand()],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
    },
})
export class DishdetailComponent implements OnInit {

  dishcopy: Dish;

  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  visibility = 'shown';
  @ViewChild('cform') commentFormDirective;
  commentForm: FormGroup;
  comment: Comment;

  
  formErrors = {
    author: '' ,
    comment: ''
  };
  validationMessages = {
    'author': {
      'required': 'Author is required.' ,
      'minlength': 'Author must be at least 2 characters long.'
    } ,
    'comment': {
      'required': 'comment is required.'
    } ,
  };
  
  constructor(private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL')private BaseURL) { 
      
    }

  ngOnInit(){
    this.createForm();
    this.dishService.getDishIds().subscribe((dishIds) => this.dishIds = dishIds);

    this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(params['id']); }))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
      errmess => this.errMess = <any>errmess);
  }

  goBack(): void {
    this.location.back();
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }
  createForm(): void {
    this.commentForm = this.fb.group({
      author: ['' , [Validators.required , Validators.minLength(2)]] ,
      rating: 5 ,
      comment: ['' ,Validators.required]
    });

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data) ,
        errmess => this.errMess = <any>errmess);

    this.onValueChanged(); // (re)set validation messages now
  }

  formatLabel(rating: number) {
    if (rating >= 6) {
      return Math.round(rating / 6);
    }

    return rating;
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    this.comment.date = new Date().toISOString();
    console.log(this.comment);
    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
    
    this.commentForm.reset({
      author: '' ,
      rating: 5 ,
      comment: ''
    });
    this.commentFormDirective.resetForm();
  }


  onValueChanged(data?: any) {
    if (!this.commentForm) {return;}
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  } 

}
